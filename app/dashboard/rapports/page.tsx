'use client'

import DashboardFrame from '@/components/dashboard/dashboard-frame'
import RapportsView from '@/components/dashboard/rapports-view'

export default function RapportsPage() {
  return (
    <DashboardFrame active="Rapports">
      <RapportsView variant="full" />
    </DashboardFrame>
  )
}