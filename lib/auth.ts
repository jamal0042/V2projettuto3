import { createClient } from '@/lib/supabase/server'

export type MemberRole = 'admin' | 'librarian' | 'teacher' | 'student' | 'external'

export type Member = {
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
  status: string
  invite_status?: string | null
  invite_sent_at?: string | null
  invite_expires_at?: string | null
  invite_accepted_at?: string | null
  invited_by?: string | null
  created_at: string
  updated_at?: string
  [key: string]: unknown
}

export const ADMIN_ROLES: MemberRole[] = ['admin', 'librarian']

export function isAdminRole(role: string | null | undefined) {
  return role === 'admin' || role === 'librarian'
}

export async function getSessionUser() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  return user
}

export async function getMemberProfile(userId: string): Promise<Member | null> {
  const supabase = await createClient()
  const { data } = await supabase.from('members').select('*').eq('id', userId).maybeSingle()
  return (data as Member | null) ?? null
}

export async function getCurrentMember(): Promise<Member | null> {
  const user = await getSessionUser()
  if (!user) return null
  return getMemberProfile(user.id)
}

export async function requireAdminAccess(): Promise<Member | null> {
  const member = await getCurrentMember()
  if (!member || !isAdminRole(member.role)) return null
  return member
}