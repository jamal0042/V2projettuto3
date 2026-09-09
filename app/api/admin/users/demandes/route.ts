import { NextResponse } from 'next/server'
import { requireAdminAccess } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { logActivity } from '@/lib/api/audit'
import { issueInvitation } from '@/lib/api/invitations'
import { sendInvitationEmail } from '@/lib/mailer'
import { sanitizeEmail } from '@/lib/api/users'

function getBaseUrl(request: Request) {
  return request.headers.get('origin') || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
}

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const admin = createAdminClient()
  const actor = await requireAdminAccess()
  if (!admin) return NextResponse.json({ error: 'Supabase non configurée.' }, { status: 500 })
  if (!actor) return NextResponse.json({ error: 'Accès non autorisé.' }, { status: 403 })

  try {
    const url = new URL(request.url)
    const status = url.searchParams.get('status') || 'pending'
    let query = admin
      .from('membership_requests')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(200)
    if (status !== 'all') query = query.eq('status', status)

    const { data, error } = await query
    if (error) {
      if (error.code === 'PGRST205' || /does not exist/i.test(error.message)) {
        return NextResponse.json(
          { error: 'La table membership_requests n’existe pas encore. Appliquez la migration SQL fournie.' },
          { status: 501 }
        )
      }
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    return NextResponse.json({ data: (data || []) as Record<string, unknown>[] })
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

  const id = String(body.id || '')
  const action = String(body.action || '')

  try {
    const { data: req, error: reqError } = await admin
      .from('membership_requests')
      .select('*')
      .eq('id', id)
      .single()
    if (reqError) return NextResponse.json({ error: reqError.message }, { status: 404 })
    if (req.status !== 'pending' && action === 'accept')
      return NextResponse.json({ error: 'Cette demande n’est plus en attente.' }, { status: 400 })

    if (action === 'reject' || action === 'archive') {
      const { error: updateError } = await admin
        .from('membership_requests')
        .update({
          status: action === 'reject' ? 'rejected' : 'archived',
          reviewed_by: actor.id,
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', id)
      if (updateError) return NextResponse.json({ error: updateError.message }, { status: 400 })
      await logActivity(actor.id, 'request.rejected', 'membership_request', id, {
        status: action === 'reject' ? 'rejected' : 'archived',
      })
      return NextResponse.json({ ok: true })
    }

    if (action === 'accept') {
      const firstName = String(req.first_name || '').trim()
      const lastName = String(req.last_name || '').trim()
      const email = sanitizeEmail(String(req.email || ''))
      const role = req.account_type === 'external' ? 'external' : 'student'
      const baseUrl = getBaseUrl(request)

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
      const extra: Record<string, unknown> = {}
      for (const key of ['phone', 'matricule', 'department', 'level', 'speciality', 'notes']) {
        if (req[key]) extra[key] = req[key]
      }

      const { error: memberError } = await admin.from('members').insert({
        id: memberId,
        first_name: firstName,
        last_name: lastName,
        email,
        role,
        status: 'pending',
        invite_status: null,
        invited_by: actor.id,
        ...extra,
      })
      if (memberError) {
        await admin.auth.admin.deleteUser(memberId)
        return NextResponse.json({ error: memberError.message }, { status: 400 })
      }

      const invitation = await issueInvitation(memberId, baseUrl)

      let mailResult: { sent: boolean; reason?: string; error?: string } = { sent: false }
      if (!('error' in invitation)) {
        mailResult = await sendInvitationEmail({
          to: email,
          firstName,
          accountType: role,
          link: invitation.link,
          expiresInHours: 72,
        })
      } else {
        mailResult = { sent: false, error: invitation.error }
      }

      await admin
        .from('membership_requests')
        .update({
          status: 'approved',
          reviewed_by: actor.id,
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', id)

      await logActivity(actor.id, 'request.accepted', 'member', memberId, {
        email,
        invitation_sent: mailResult.sent,
      })

      return NextResponse.json({
        ok: true,
        member: { id: memberId, email, firstName, lastName, role, status: 'pending' },
        invitation: mailResult,
      })
    }

    return NextResponse.json({ error: 'Action inconnue.' }, { status: 400 })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur serveur'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}