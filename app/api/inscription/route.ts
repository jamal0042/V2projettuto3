import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { logActivity } from '@/lib/api/audit'
import { PUBLIC_REQUEST_ROLES, sanitizeEmail } from '@/lib/api/users'

export async function POST(request: Request) {
  const admin = createAdminClient()
  if (!admin) return NextResponse.json({ error: 'Supabase non configurée.' }, { status: 500 })

  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Corps de requête invalide.' }, { status: 400 })
  }

  const firstName = String(body.first_name || '').trim()
  const lastName = String(body.last_name || '').trim()
  const email = sanitizeEmail(String(body.email || ''))
  const accountType = String(body.account_type || 'student')

  if (!firstName || !lastName || !email)
    return NextResponse.json({ error: 'Prénom, nom et email sont obligatoires.' }, { status: 400 })
  if (!email.includes('@') || email.length < 5)
    return NextResponse.json({ error: 'Adresse email invalide.' }, { status: 400 })
  if (!(PUBLIC_REQUEST_ROLES as readonly string[]).includes(accountType))
    return NextResponse.json({ error: 'Type de compte invalide.' }, { status: 400 })

  const fields: Record<string, unknown> = {}
  for (const key of ['phone', 'matricule', 'department', 'level', 'speciality', 'notes']) {
    if (body[key] !== undefined && String(body[key]).trim() !== '') {
      fields[key] = String(body[key]).trim()
    }
  }

  try {
    const { data, error } = await admin
      .from('membership_requests')
      .insert({ first_name: firstName, last_name: lastName, email, account_type: accountType, ...fields })
      .select()
      .single()
    if (error) {
      if (/duplicate key|unique constraint/i.test(error.message)) {
        return NextResponse.json(
          { error: 'Une demande existe déjà pour cette adresse email.' },
          { status: 409 }
        )
      }
      if (/does not exist/i.test(error.message)) {
        return NextResponse.json(
          { error: 'La table membership_requests n’existe pas encore. Contactez l’administrateur.' },
          { status: 501 }
        )
      }
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    await logActivity(null, 'request.created', 'membership_request', (data as { id: string }).id, {
      email,
      accountType,
    })

    return NextResponse.json({ ok: true, id: (data as { id: string }).id }, { status: 201 })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur serveur'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}