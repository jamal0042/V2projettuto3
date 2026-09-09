import type { LucideIcon } from 'lucide-react'

export type DashboardNavItem = {
  label: string
  icon: LucideIcon
  href: string
  roles?: MemberRole[]
}
export type MemberRole = 'admin' | 'librarian' | 'teacher' | 'student' | 'external'

export type DashboardNavGroup = {
  label: string
  items: DashboardNavItem[]
}

export type DashboardStats = {
  documents: number | null
  availableCopies: number | null
  activeLoans: number | null
  members: number | null
}

export type DashboardActivity = {
  id: number
  action: string
  entity: string | null
  created_at: string
}

export function filterDashboardGroups(groups: DashboardNavGroup[], role: MemberRole) {
  return groups
    .map((group) => ({ ...group, items: group.items.filter((item) => !item.roles || item.roles.includes(role)) }))
    .filter((group) => group.items.length > 0)
}
