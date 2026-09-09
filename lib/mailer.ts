export type SendMailResult = { sent: boolean; reason?: string; error?: string }

export type InvitationEmailData = {
  to: string
  firstName: string
  accountType: string
  link: string
  expiresInHours: number
}

export function buildInvitationEmailHtml(data: InvitationEmailData) {
  const typeLabel = data.accountType === 'external' ? 'Externe' : 'Étudiant'
  const blue = '#3d6df2'
  const amber = '#e9a53a'
  const text = '#172033'
  const muted = '#6b758a'
  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
</head>
<body style="margin:0;padding:0;background:#f4f6fa;font-family:Arial,Helvetica,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6fa;padding:32px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:540px;background:#ffffff;border:1px solid #e1e6ef;border-radius:14px;overflow:hidden;">
          <tr>
            <td style="background:linear-gradient(120deg, ${blue}, #2b5bd6);padding:28px 32px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="color:#ffffff;font-size:18px;font-weight:bold;letter-spacing:-0.3px;">Biblius</td>
                  <td align="right" style="color:#cfe0ff;font-size:11px;">Library OS</td>
                </tr>
              </table>
             <div style="width:34px;height:4px;background:${amber};border-radius:2px;margin-top:10px;"></div>
            </td>
          </tr>
          <tr>
            <td style="padding:32px;">
              <h1 style="margin:0 0 8px;color:${text};font-size:20px;letter-spacing:-0.3px;">Activation de votre compte</h1>
              <p style="margin:0 0 20px;color:${muted};font-size:13px;line-height:1.6;">Bonjour ${data.firstName}, votre compte <strong>Biblius</strong> a été créé avec le type de compte <strong>${typeLabel}</strong>.</p>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f7f9fc;border:1px solid #e1e6ef;border-radius:10px;padding:16px 20px;margin-bottom:22px;">
                <tr>
                  <td style="font-size:12px;color:${muted};padding:2px 0;">Adresse email</td>
                </tr>
                <tr>
                  <td style="font-size:14px;color:${text};font-weight:bold;padding:2px 0;">${data.to}</td>
                </tr>
              </table>
              <p style="margin:0 0 24px;color:${muted};font-size:13px;line-height:1.6;">Pour finaliser votre inscription, cliquez sur le bouton ci-dessous afin de <strong>définir votre mot de passe</strong> et activer votre accès à la plateforme.</p>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
                <tr>
                  <td align="center">
                    <a href="${data.link}" style="display:inline-block;padding:13px 28px;background:${blue};color:#ffffff;text-decoration:none;border-radius:9px;font-size:14px;font-weight:bold;">Activer mon compte</a>
                  </td>
                </tr>
              </table>
              <p style="margin:0 0 6px;color:${muted};font-size:12px;line-height:1.6;">Ce lien est temporaire et expire sous <strong>${data.expiresInHours} heures</strong>. Une fois expiré, vous pourrez être invité à nouveau.</p>
              <p style="margin:0;color:${muted};font-size:12px;line-height:1.6;">Votre mot de passe ne vous sera jamais envoyé par email : vous le définissez vous-même via ce lien.</p>
            </td>
          </tr>
          <tr>
            <td style="padding:20px 32px;background:#f7f9fc;border-top:1px solid #e1e6ef;">
              <p style="margin:0;color:${muted};font-size:11px;line-height:1.5;">© 2026 Biblius · Library OS. Cet email a été envoyé suite à la création d’un compte administrateur. Si vous n’êtes pas à l’origine de cette demande, ignorez ce message.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

export async function sendInvitationEmail(
  data: InvitationEmailData
): Promise<SendMailResult> {
  const apiKey = process.env.RESEND_API_KEY
  const from = process.env.MAIL_FROM || 'Biblius <no-reply@biblius.app>'
  if (!apiKey) return { sent: false, reason: 'EMAIL_NOT_CONFIGURED' }
  const html = buildInvitationEmailHtml(data)
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from,
        to: [data.to],
        subject: 'Activation de votre compte Biblius',
        html,
      }),
    })
    if (!res.ok) {
      const body = await res.text().catch(() => '')
      return { sent: false, error: `Resend a répondu ${res.status} : ${body}` }
    }
    return { sent: true }
  } catch (error) {
    return { sent: false, error: error instanceof Error ? error.message : 'Erreur d’envoi' }
  }
}