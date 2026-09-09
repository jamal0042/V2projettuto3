'use client'

import { useEffect, useState } from 'react'
import { Archive, BarChart3, Bell, BookOpen, Clock3, Database, FileText, LayoutDashboard, Library, RotateCcw, ShieldCheck, Users } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import DashboardSidebar from './dashboard-sidebar'
import DashboardTopbar from './dashboard-topbar'
import { filterDashboardGroups, type DashboardNavGroup, type MemberRole } from './dashboard-types'

const groups: DashboardNavGroup[] = [
  { label: 'Workspace', items: [{ label: 'Dashboard', icon: LayoutDashboard, href: '/dashboard' }, { label: 'Documents', icon: FileText, href: '/dashboard/documents', roles: ['admin', 'librarian', 'teacher', 'student', 'external'] }, { label: 'Bibliothèque numérique', icon: Library, href: '/dashboard/ressources-numeriques', roles: ['admin', 'librarian', 'teacher', 'student', 'external'] }] },
  { label: 'Catalogue', items: [{ label: 'Exemplaires', icon: Archive, href: '/dashboard/exemplaires', roles: ['admin', 'librarian'] }, { label: 'Auteurs', icon: Users, href: '/dashboard/auteurs', roles: ['admin', 'librarian'] }, { label: 'Classifications', icon: Database, href: '/dashboard/statistiques', roles: ['admin', 'librarian', 'teacher'] }, { label: 'Emplacements', icon: ShieldCheck, href: '/dashboard/emplacements', roles: ['admin', 'librarian'] }] },
  { label: 'Circulation', items: [{ label: 'Emprunts & retours', icon: Clock3, href: '/dashboard/prets', roles: ['admin', 'librarian'] }, { label: 'Retours', icon: RotateCcw, href: '/dashboard/retours', roles: ['admin', 'librarian'] }, { label: 'Réservations', icon: BookOpen, href: '/dashboard/reservations', roles: ['admin', 'librarian', 'teacher', 'student', 'external'] }, { label: 'Pénalités', icon: Bell, href: '/dashboard/penalites', roles: ['admin', 'librarian'] }] },
  { label: 'Administration', items: [{ label: 'Utilisateurs', icon: Users, href: '/dashboard/utilisateurs', roles: ['admin', 'librarian'] }] },
  { label: 'Rapports', items: [{ label: 'Rapports', icon: BarChart3, href: '/dashboard/rapports' }] },
]

export default function DashboardFrame({ active, children }: { active: string; children: React.ReactNode }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [dark, setDark] = useState(true)
  const [role, setRole] = useState<MemberRole>('student')
  const [member, setMember] = useState<{ first_name: string; last_name: string; role: MemberRole } | null>(null)

  useEffect(() => {
    const savedTheme = window.localStorage.getItem('biblius-dashboard-theme')
    if (savedTheme) setDark(savedTheme === 'dark')
    const supabase = createClient()
    supabase.auth.getSession().then(async ({ data }) => {
      if (!data.session?.user) return
      const { data: profile } = await supabase.from('members').select('first_name, last_name, role').eq('id', data.session.user.id).maybeSingle()
      if (profile?.role) {
        setRole(profile.role as MemberRole)
        setMember({ first_name: profile.first_name || '', last_name: profile.last_name || '', role: profile.role as MemberRole })
      }
    })
  }, [])

  function toggleTheme() {
    setDark((current) => {
      const next = !current
      window.localStorage.setItem('biblius-dashboard-theme', next ? 'dark' : 'light')
      return next
    })
  }

  async function logout() {
    await createClient().auth.signOut()
    router.replace('/auth')
    router.refresh()
  }

  return <main className={`${dark ? 'dark min-h-screen bg-slate-950 text-slate-100' : 'min-h-screen bg-slate-50 text-slate-900'} transition-colors duration-300 flex`}><DashboardSidebar groups={filterDashboardGroups(groups, role)} active={active} open={open} onNavigate={(label, href) => { setOpen(false); router.push(href) }} onClose={() => setOpen(false)} onLogout={logout} onSettings={() => router.push('/dashboard/parametres')} onHelp={() => router.push('/dashboard/agent-ia')} role={role} member={member} /><section className="flex-1 lg:ml-64 flex flex-col min-h-screen"><DashboardTopbar active={active} dark={dark} onMenu={() => setOpen(true)} onToggleTheme={toggleTheme} initials={member ? `${(member.first_name[0] || '').toUpperCase()}${(member.last_name[0] || '').toUpperCase()}` : ''} />{children}</section></main>
}