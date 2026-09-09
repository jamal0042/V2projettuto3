import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { logActivity } from '@/lib/api/audit'
import { hashToken, isInvitationExpired } from '@/lib/api/invitations'

export async function POST(request: Request) {
  const admin = createAdminClient()
  if (!admin) return NextResponse.json({ error: 'Supabase non configurée.' }, { status: 500 })

  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Corps de requête invalide.' }, { status: 400 })
  }

  const token = String(body.token || '')
  const password = String(body.password || '')

  if (!token || token.length < 32)
    return NextResponse.json({ error: 'Lien d’activation invalide.' }, { status: 400 })
  if (password.length < 8)
    return NextResponse.json({ error: 'Le mot de passe doit contenir au moins 8 caractères.' }, { status: 400 })

  const tokenHash = hashToken(token)

  try {
    const { data: member, error: memberError } = await admin
      .from('members')
      .select('id, status, invite_status, invite_expires_at, invite_accepted_at, email, invite_token_hash')
      .eq('invite_token_hash', tokenHash)
      .maybeSingle()

    if (memberError) return NextResponse.json({ error: memberError.message }, { status: 400 })
    if (!member) return NextResponse.json({ error: 'Lien d’activation invalide ou déjà utilisé.' }, { status: 400 })
    if (member.invite_status === 'accepted')
      return NextResponse.json({ error: 'Ce lien a déjà été utilisé.' }, { status: 400 })
    if (member.invite_status === 'revoked')
      return NextResponse.json({ error: 'Cette invitation a été révoquée.' }, { status: 400 })
    if (isInvitationExpired(member))
      return NextResponse.json({ error: 'Cette invitation a expiré. Contactez l’administrateur pour en recevoir une nouvelle.' }, { status: 400 })

    const { error: authError } = await admin.auth.admin.updateUserById(String(member.id), { password })
    if (authError) {
      if (/password/i.test(authError.message) && /shorter than|6 characters/i.test(authError.message)) {
        return NextResponse.json({ error: 'Le mot de passe est trop court.' }, { status: 400 })
      }
      return NextResponse.json({ error: authError.message }, { status: 400 })
    }

    const { error: updateError } = await admin
      .from('members')
      .update({
        status: 'active',
        invite_status: 'accepted',
        invite_accepted_at: new Date().toISOString(),
        invite_token_hash: null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', String(member.id))
    if (updateError) return NextResponse.json({ error: updateError.message }, { status: 400 })

    await logActivity(null, 'user.activated', 'member', String(member.id), {
      email: member.email,
    })

    return NextResponse.json({ ok: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur serveur'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}