import { NextResponse } from 'next/server'
import { requireAdminAccess } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { logActivity } from '@/lib/api/audit'
import { issueInvitation } from '@/lib/api/invitations'
import { sendInvitationEmail } from '@/lib/mailer'
import { ALLOWED_CREATE_ROLES, sanitizeEmail } from '@/lib/api/users'

function getBaseUrl(request: Request) {
  return request.headers.get('origin') || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
}

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const admin = createAdminClient()
  const actor = await requireAdminAccess()
  if (!admin) return NextResponse.json({ error: 'Supabase non configurée.' }, { status: 500 })
  if (!actor) return NextResponse.json({ error: 'Accès non autorisé.' }, { status: 403 })

  const url = new URL(request.url)
  const search = (url.searchParams.get('search') || '').trim()
  const role = url.searchParams.get('role') || ''
  const status = url.searchParams.get('status') || ''
  const page = Math.max(1, Number(url.searchParams.get('page') || 1))
  const pageSize = Math.min(Number(url.searchParams.get('pageSize') || 20), 50)

  try {
    let query = admin.from('members').select('*', { count: 'exact' })
    if (search) {
      query = query.or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%,email.ilike.%${search}%`)
    }
    if (role) query = query.eq('role', role)
    if (status) query = query.eq('status', status)

    const from = (page - 1) * pageSize
    const to = from + pageSize - 1
    query = query.order('created_at', { ascending: false }).range(from, to)

    const { data, count, error } = await query
    if (error) return NextResponse.json({ error: error.message }, { status: 400 })

    const members = (data || []) as Record<string, unknown>[]

    const { data: authUsers } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 })
    const signInMap = new Map<string, string | null>()
    for (const u of authUsers?.users || []) {
      signInMap.set(u.id, u.last_sign_in_at || null)
    }
    const rows = members.map((m) => ({ ...m, last_sign_in_at: signInMap.get(String(m.id)) || null }))

    return NextResponse.json({ data: rows, total: count ?? rows.length })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur serveur'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const admin = createAdminClient()
  const actor = await requireAdminAccess()
  if (!admin) return NextResponse.json({ error: 'Supabase non configurée.' }, { status: 500 })
  if (!actor) return NextResponse.json({ error: 'Accès non autorisé.' }, { status: 403 })

  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Corps de requête invalide.' }, { status: 400 })
  }

  const firstName = String(body.first_name || '').trim()
  const lastName = String(body.last_name || '').trim()
  const email = sanitizeEmail(String(body.email || ''))
  const role = String(body.role || '')
  const baseUrl = getBaseUrl(request)

  if (!firstName || !lastName || !email)
    return NextResponse.json({ error: 'Prénom, nom et email sont obligatoires.' }, { status: 400 })
  if (!(ALLOWED_CREATE_ROLES as readonly string[]).includes(role))
    return NextResponse.json({ error: 'Type de compte invalide.' }, { status: 400 })

  const profileFields: Record<string, unknown> = {}
  const allowed = ['phone', 'matricule', 'department', 'level', 'speciality', 'birth_date', 'address', 'city', 'notes']
  for (const key of allowed) {
    if (body[key] !== undefined && body[key] !== null && String(body[key]).trim() !== '') {
      profileFields[key] = String(body[key]).trim()
    }
  }

  try {
    const { data: authUser, error: authError } = await admin.auth.admin.createUser({
      email,
      email_confirm: true,
      user_metadata: { full_name: `${firstName} ${lastName}`, role },
    })

    if (authError) {
      if (/already registered|already been registered|duplicate/i.test(authError.message)) {
        return NextResponse.json({ error: `Un compte existe déjà pour ${email}.` }, { status: 409 })
      }
      return NextResponse.json({ error: authError.message }, { status: 400 })
    }
    if (!authUser?.user) return NextResponse.json({ error: 'Création du compte impossible.' }, { status: 500 })

    const memberId = authUser.user.id
    const memberPayload: Record<string, unknown> = {
      id: memberId,
      first_name: firstName,
      last_name: lastName,
      email,
      role,
      status: 'pending',
      invite_status: null,
      invited_by: actor.id,
      ...profileFields,
    }

    const { error: memberError } = await admin.from('members').insert(memberPayload)
    if (memberError) {
      await admin.auth.admin.deleteUser(memberId)
      return NextResponse.json({ error: memberError.message }, { status: 400 })
    }

    const invitation = await issueInvitation(memberId, baseUrl)
    if ('error' in invitation) {
      return NextResponse.json({
        member: { id: memberId, email, status: 'pending' },
        warning: `Compte créé mais invitation impossible : ${invitation.error}`,
      })
    }

    const mail = await sendInvitationEmail({
      to: email,
      firstName,
      accountType: role,
      link: invitation.link,
      expiresInHours: 72,
    })

    await logActivity(actor.id, 'user.created', 'member', memberId, {
      email,
      role,
      invitation_sent: mail.sent,
    })

    return NextResponse.json(
      {
        member: { id: memberId, email, firstName, lastName, role, status: 'pending' },
        invitation: { sent: mail.sent, reason: mail.reason, error: mail.error },
      },
      { status: 201 }
    )
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur serveur'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}