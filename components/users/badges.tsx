'use client'

import { Badge } from './ui'
import { getDisplayState, ROLE_BADGES, ROLE_LABELS, type Member, type MemberRole } from './user-types'

export function RoleBadge({ role, className = '' }: { role: MemberRole; className?: string }) {
  return <Badge className={`${ROLE_BADGES[role]} ${className}`}>{ROLE_LABELS[role]}</Badge>
}

export function StatusBadge({ member }: { member: Member }) {
  const state = getDisplayState(member)
  return <Badge className={state.badge}>{state.label}</Badge>
}