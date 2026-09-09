export const ALLOWED_CREATE_ROLES = ['student', 'external', 'teacher', 'librarian'] as const
export const PUBLIC_REQUEST_ROLES = ['student', 'external'] as const

export const PROFILE_FIELDS = [
  'first_name',
  'last_name',
  'phone',
  'matricule',
  'department',
  'level',
  'speciality',
  'birth_date',
  'address',
  'city',
  'notes',
  'max_loans',
  'max_loans_duration',
  'max_digital_loans',
  'email_notifications',
  'sms_notifications',
] as const

export function canChangeStatus(from: string, to: string): boolean {
  switch (to) {
    case 'active':
      return ['suspended', 'inactive'].includes(from)
    case 'suspended':
      return ['active', 'inactive'].includes(from)
    case 'inactive':
      return ['active', 'suspended', 'pending', 'inactive'].includes(from)
    default:
      return false
  }
}

export function canAssignRole(
  actorRole: string,
  targetCurrentRole: string,
  newRole: string,
  targetEmail: string
): { ok: boolean; reason?: string } {
  if (actorRole !== 'admin') return { ok: false, reason: 'Seul un administrateur peut modifier les rôles.' }
  if (targetCurrentRole === 'admin' && newRole !== 'admin')
    return { ok: false, reason: 'Le rôle d’un administrateur ne peut pas être modifié.' }
  const adminEmails = (process.env.ADMIN_EMAILS || '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean)
  if (newRole === 'admin' && !adminEmails.includes(targetEmail.toLowerCase()))
    return { ok: false, reason: 'Promotion au rôle administrateur non autorisée pour cet email.' }
  return { ok: true }
}

export function sanitizeEmail(email: string) {
  return email.trim().toLowerCase()
}