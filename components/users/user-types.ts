export type MemberRole = 'admin' | 'librarian' | 'teacher' | 'student' | 'external'
export type MemberStatus = 'active' | 'pending' | 'suspended' | 'inactive'
export type InviteStatus = 'pending' | 'accepted' | 'expired' | 'revoked' | null

export interface Member {
  id: string
  role: MemberRole
  first_name: string
  last_name: string
  email: string | null
  phone?: string | null
  matricule?: string | null
  department?: string | null
  level?: string | null
  speciality?: string | null
  status: MemberStatus
  invite_status?: InviteStatus
  invite_sent_at?: string | null
  invite_expires_at?: string | null
  invite_accepted_at?: string | null
  invited_by?: string | null
  created_at: string
  updated_at?: string | null
  last_sign_in_at?: string | null
  email_confirmed?: boolean
  birth_date?: string | null
  address?: string | null
  city?: string | null
  notes?: string | null
  max_loans?: number
  max_loans_duration?: number
  max_digital_loans?: number
  email_notifications?: boolean
  sms_notifications?: boolean
}

export interface MembershipRequest {
  id: string
  first_name: string
  last_name: string
  email: string
  phone?: string | null
  account_type: 'student' | 'external'
  matricule?: string | null
  department?: string | null
  level?: string | null
  speciality?: string | null
  notes?: string | null
  status: 'pending' | 'approved' | 'rejected' | 'archived'
  reviewed_by?: string | null
  reviewed_at?: string | null
  created_at: string
}

export const ROLE_LABELS: Record<MemberRole, string> = {
  admin: 'Administrateur',
  librarian: 'Bibliothécaire',
  teacher: 'Enseignant',
  student: 'Étudiant',
  external: 'Externe',
}

export const ROLE_BADGES: Record<MemberRole, string> = {
  admin: 'bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-900/30 dark:text-violet-300 dark:border-violet-700',
  librarian:
    'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-700',
  teacher:
    'bg-cyan-50 text-cyan-700 border-cyan-200 dark:bg-cyan-900/30 dark:text-cyan-300 dark:border-cyan-700',
  student:
    'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-700',
  external:
    'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-700',
}

export interface DisplayState {
  label: string
  badge: string
}

export function getDisplayState(m: Member): DisplayState {
  if (m.status === 'active')
    return { label: 'Actif', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-700' }
  if (m.status === 'suspended')
    return { label: 'Suspendu', badge: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-700' }
  if (m.status === 'inactive')
    return { label: 'Inactif', badge: 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700' }

  if (m.status === 'pending') {
    if (m.invite_status === 'expired')
      return { label: 'Invitation expirée', badge: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-700' }
    if (m.invite_status === 'revoked')
      return { label: 'Invitation révoquée', badge: 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700' }
    if (m.invite_status === 'accepted')
      return { label: 'En attente', badge: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-700' }
    if (m.invite_status === null)
      return { label: 'Demande', badge: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-700' }
    if (m.invite_expires_at && new Date(m.invite_expires_at).getTime() < Date.now())
      return { label: 'Invitation expirée', badge: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-700' }
    return { label: 'Invitation envoyée', badge: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-700' }
  }

  return { label: m.status, badge: 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700' }
}

export const STATUS_FILTERS = [
  { value: 'all', label: 'Tous les statuts' },
  { value: 'active', label: 'Actifs' },
  { value: 'pending', label: 'En attente' },
  { value: 'suspended', label: 'Suspendus' },
  { value: 'inactive', label: 'Inactifs' },
]

export const ROLE_FILTERS = [
  { value: 'all', label: 'Tous les types' },
  { value: 'student', label: 'Étudiants' },
  { value: 'external', label: 'Externes' },
  { value: 'teacher', label: 'Enseignants' },
  { value: 'librarian', label: 'Bibliothécaires' },
  { value: 'admin', label: 'Administrateurs' },
]

export function getInitials(first: string, last: string) {
  return `${(first[0] || '').toUpperCase()}${(last[0] || '').toUpperCase()}`
}

export function formatDate(value: string | null | undefined) {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }).format(date)
}

export function formatDateTime(value: string | null | undefined) {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

export function avatarColor(name: string) {
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) % 360
  return `hsl(${hash} 45% 45%)`
}