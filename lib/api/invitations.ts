import { createHash, randomBytes } from 'crypto'
import { createAdminClient } from '@/lib/supabase/admin'

export const INVITATION_TTL_MS = 72 * 60 * 60 * 1000
export const RESEND_MIN_DELAY_MS = 2 * 60 * 1000

export function hashToken(token: string) {
  return createHash('sha256').update(token).digest('hex')
}

export function generateToken() {
  return randomBytes(32).toString('hex')
}

export function isInvitationExpired(member: { invite_expires_at?: string | null }) {
  if (!member.invite_expires_at) return false
  return new Date(member.invite_expires_at).getTime() < Date.now()
}

export type ResendCheck = { ok: boolean; reason?: string }

export function canResendInvitation(member: {
  status?: string | null
  invite_status?: string | null
  invite_sent_at?: string | null
}): ResendCheck {
  if (member.status === 'active') return { ok: false, reason: 'Compte déjà actif.' }
  if (member.invite_status === 'accepted')
    return { ok: false, reason: 'Invitation déjà acceptée.' }
  if (!member.invite_sent_at) return { ok: true }
  const elapsed = Date.now() - new Date(member.invite_sent_at).getTime()
  if (elapsed < RESEND_MIN_DELAY_MS)
    return { ok: false, reason: 'Un email a déjà été envoyé très récemment. Patientez quelques minutes.' }
  return { ok: true }
}

export async function issueInvitation(
  memberId: string,
  baseUrl: string
): Promise<{ token: string; link: string; expiresAt: string; error?: never } | { error: string }> {
  const admin = createAdminClient()
  if (!admin) return { error: 'Supabase non configurée.' }

  const token = generateToken()
  const expiresAt = new Date(Date.now() + INVITATION_TTL_MS).toISOString()

  const { error } = await admin
    .from('members')
    .update({
      invite_status: 'pending',
      invite_token_hash: hashToken(token),
      invite_sent_at: new Date().toISOString(),
      invite_expires_at: expiresAt,
      invite_accepted_at: null,
    })
    .eq('id', memberId)

  if (error) return { error: error.message }

  return { token, link: `${baseUrl}/activation/${token}`, expiresAt }
}