import { NextResponse } from 'next/server'
import { requireAdminAccess } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { logActivity } from '@/lib/api/audit'
import { canResendInvitation, issueInvitation } from '@/lib/api/invitations'
import { sendInvitationEmail } from '@/lib/mailer'

function getBaseUrl(request: Request) {
  return request.headers.get('origin') || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
}

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params
  const admin = createAdminClient()
  const actor = await requireAdminAccess()
  if (!admin) return NextResponse.json({ error: 'Supabase non configurée.' }, { status: 500 })
  if (!actor) return NextResponse.json({ error: 'Accès non autorisé.' }, { status: 403 })

  try {
    const { data: member, error: fetchError } = await admin
      .from('members')
      .select('*')
      .eq('id', id)
      .single()
    if (fetchError) return NextResponse.json({ error: fetchError.message }, { status: 404 })

    const check = canResendInvitation(member)
    if (!check.ok) return NextResponse.json({ error: check.reason }, { status: 400 })

    const invitation = await issueInvitation(id, getBaseUrl(request))
    if (!('token' in invitation)) {
      return NextResponse.json({ error: invitation.error }, { status: 500 })
    }

    const mail = await sendInvitationEmail({
      to: String(member.email),
      firstName: String(member.first_name || ''),
      accountType: String(member.role || 'external'),
      link: invitation.link,
      expiresInHours: 72,
    })

    await logActivity(actor.id, 'invitation.resend', 'member', id, {
      sent: mail.sent,
      reason: mail.reason,
      expires_at: invitation.expiresAt,
    })

    return NextResponse.json({
      invitation: {
        sent: mail.sent,
        reason: mail.reason,
        error: mail.error,
        sent_at: new Date().toISOString(),
        expires_at: invitation.expiresAt,
      },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur serveur'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}