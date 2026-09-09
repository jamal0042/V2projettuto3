'use client'

import { useEffect, useState } from 'react'
import {
  Archive, BarChart3, Bell, BookOpen, Bot, CalendarDays, Clock3,
  Database, FileText, Inbox, LayoutDashboard, Library, Plus, RotateCcw, ShieldCheck, Sparkles, Users,
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import DashboardSidebar from '@/components/dashboard/dashboard-sidebar'
import DashboardTopbar from '@/components/dashboard/dashboard-topbar'
import RapportsView from '@/components/dashboard/rapports-view'
import { ActivityPanel, DashboardStatsGrid } from '@/components/dashboard/dashboard-widgets'
import { filterDashboardGroups, type DashboardActivity, type DashboardNavGroup, type DashboardStats, type MemberRole } from '@/components/dashboard/dashboard-types'

const navGroups: DashboardNavGroup[] = [
  {
    label: 'Workspace',
    items: [
      { label: 'Dashboard', icon: LayoutDashboard, href: '/dashboard' },
      { label: 'Documents', icon: FileText, href: '/dashboard/documents', roles: ['admin', 'librarian', 'teacher', 'student', 'external'] },
      { label: 'Bibliothèque numérique', icon: Library, href: '/dashboard/ressources-numeriques', roles: ['admin', 'librarian', 'teacher', 'student', 'external'] },
    ],
  },
  {
    label: 'Catalogue',
    items: [
      { label: 'Exemplaires', icon: Archive, href: '/dashboard/exemplaires', roles: ['admin', 'librarian'] },
      { label: 'Auteurs', icon: Users, href: '/dashboard/auteurs', roles: ['admin', 'librarian'] },
      { label: 'Classifications', icon: Database, href: '/dashboard/statistiques', roles: ['admin', 'librarian', 'teacher'] },
      { label: 'Emplacements', icon: ShieldCheck, href: '/dashboard/emplacements', roles: ['admin', 'librarian'] },
    ],
  },
{
      label: 'Circulation',
      items: [
        { label: 'Emprunts & retours', icon: Clock3, href: '/dashboard/prets', roles: ['admin', 'librarian'] },
        { label: 'Retours', icon: RotateCcw, href: '/dashboard/retours', roles: ['admin', 'librarian'] },
        { label: 'Réservations', icon: BookOpen, href: '/dashboard/reservations', roles: ['admin', 'librarian', 'teacher', 'student', 'external'] },
        { label: 'Pénalités', icon: Bell, href: '/dashboard/penalites', roles: ['admin', 'librarian'] },
      ],
    },
  {
    label: 'Administration',
    items: [{ label: 'Utilisateurs', icon: Users, href: '/dashboard/utilisateurs', roles: ['admin', 'librarian'] }],
  },
  {
    label: 'Rapports',
    items: [{ label: 'Rapports', icon: BarChart3, href: '/dashboard/rapports' }],
  },
]

const ALL_ROLES: MemberRole[] = ['admin', 'librarian', 'teacher', 'student', 'external']

const quickLinks: { label: string; desc: string; href: string; icon: any; tone: string; roles: MemberRole[] }[] = [
  { label: 'Documents', desc: 'Consulter et gérer le fonds', href: '/dashboard/documents', icon: FileText, tone: 'blue', roles: ALL_ROLES },
  { label: 'Bibliothèque numérique', desc: 'Ressources en ligne', href: '/dashboard/ressources-numeriques', icon: Library, tone: 'violet', roles: ALL_ROLES },
  { label: 'Emprunts & retours', desc: 'Suivre la circulation', href: '/dashboard/prets', icon: Clock3, tone: 'amber', roles: ['admin', 'librarian'] },
  { label: 'Réservations', desc: 'Documents réservés', href: '/dashboard/reservations', icon: BookOpen, tone: 'emerald', roles: ALL_ROLES },
  { label: 'Rapports & analyse', desc: 'Statistiques et graphiques', href: '/dashboard/rapports', icon: BarChart3, tone: 'sky', roles: ALL_ROLES },
  { label: 'Agent IA', desc: 'Assistant intelligent', href: '/dashboard/agent-ia', icon: Bot, tone: 'violet', roles: ALL_ROLES },
]

const QUICK_TONES: Record<string, string> = {
  blue: 'bg-blue-50 text-blue-600 dark:bg-blue-900/25 dark:text-blue-300',
  emerald: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/25 dark:text-emerald-300',
  amber: 'bg-amber-50 text-amber-600 dark:bg-amber-900/25 dark:text-amber-300',
  violet: 'bg-violet-50 text-violet-600 dark:bg-violet-900/25 dark:text-violet-300',
  sky: 'bg-sky-50 text-sky-600 dark:bg-sky-900/25 dark:text-sky-300',
}

export default function DashboardPage() {
  const router = useRouter()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [active, setActive] = useState('Dashboard')
  const [dark, setDark] = useState(true)
  const [role, setRole] = useState<MemberRole>('student')
  const [member, setMember] = useState<{ first_name: string; last_name: string; role: MemberRole } | null>(null)
  const [stats, setStats] = useState<DashboardStats>({ documents: null, availableCopies: null, activeLoans: null, members: null })
  const [activities, setActivities] = useState<DashboardActivity[]>([])

  useEffect(() => {
    const savedTheme = window.localStorage.getItem('biblius-dashboard-theme')
    if (savedTheme) setDark(savedTheme === 'dark')
    const supabase = createClient()
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) return
      const { data: member } = await supabase.from('members').select('first_name, last_name, role').eq('id', data.user.id).maybeSingle()
      if (member?.role) {
        setRole(member.role as MemberRole)
        setMember({ first_name: member.first_name || '', last_name: member.last_name || '', role: member.role as MemberRole })
      }
    })

    async function loadDashboardData() {
      const [documents, copies, loans, members, activity] = await Promise.all([
        supabase.from('documents').select('id', { count: 'exact', head: true }),
        supabase.from('exemplaires').select('id', { count: 'exact', head: true }).eq('status', 'available'),
        supabase.from('prets').select('id', { count: 'exact', head: true }).in('status', ['active', 'overdue']),
        supabase.from('members').select('id', { count: 'exact', head: true }).neq('status', 'inactive'),
        supabase.from('activity_log').select('id, action, entity, created_at').order('created_at', { ascending: false }).limit(5),
      ])

      setStats({
        documents: documents.error ? null : documents.count,
        availableCopies: copies.error ? null : copies.count,
        activeLoans: loans.error ? null : loans.count,
        members: members.error ? null : members.count,
      })
      if (!activity.error && activity.data) setActivities(activity.data as DashboardActivity[])
    }

    loadDashboardData()
  }, [])

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.replace('/auth')
    router.refresh()
  }

  const visibleLinks = quickLinks.filter((link) => link.roles.includes(role))
  const today = new Intl.DateTimeFormat('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(new Date())

  return (
    <main className={`${dark ? 'dark min-h-screen bg-slate-950 text-slate-100' : 'min-h-screen bg-slate-50 text-slate-900'} transition-colors duration-300 flex`} suppressHydrationWarning>
      <DashboardSidebar groups={filterDashboardGroups(navGroups, role)} active={active} open={sidebarOpen} onNavigate={(label, href) => { setActive(label); setSidebarOpen(false); router.push(href) }} onClose={() => setSidebarOpen(false)} onLogout={handleLogout} onSettings={() => router.push('/dashboard/parametres')} onHelp={() => router.push('/dashboard/agent-ia')} role={role} member={member} />

      <section className="flex-1 lg:ml-64 flex flex-col min-h-screen">
        <DashboardTopbar active={active} dark={dark} onMenu={() => setSidebarOpen(true)} onToggleTheme={() => { const next = !dark; setDark(next); window.localStorage.setItem('biblius-dashboard-theme', next ? 'dark' : 'light') }} initials={member ? `${member.first_name[0]?.toUpperCase() || ''}${member.last_name[0]?.toUpperCase() || ''}` : ''} />

        <div className="flex-1 p-6 lg:p-8 space-y-8">
          {/* HERO */}
          <section className="relative overflow-hidden rounded-2xl bg-slate-900 dark:bg-slate-950 border border-slate-800 text-white p-6 lg:p-8">
            <div aria-hidden="true" className="absolute inset-0">
              <div className="absolute -top-24 -right-16 h-72 w-72 rounded-full bg-blue-600/30 blur-3xl" />
              <div className="absolute -bottom-28 left-1/4 h-72 w-72 rounded-full bg-violet-600/20 blur-3xl" />
              <div className="absolute inset-0 opacity-[0.07]" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.6) 1px, transparent 1px)', backgroundSize: '44px 44px' }} />
            </div>
            <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <div className="mb-3 flex flex-wrap items-center gap-3">
                  <span className="inline-flex items-center gap-2 rounded-full bg-emerald-400/10 px-3 py-1 text-xs font-semibold text-emerald-300 ring-1 ring-emerald-400/30">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" /> Système opérationnel
                  </span>
                  <span className="hidden sm:inline-flex items-center gap-1.5 text-xs text-slate-400">
                    <CalendarDays size={13} /> {today}
                  </span>
                </div>
                <h1 className="text-2xl lg:text-3xl font-extrabold tracking-tight">Bonjour, {member?.first_name || '…'}.</h1>
                <p className="mt-1.5 max-w-xl text-sm text-slate-300">Voici ce qui se passe dans votre bibliothèque aujourd’hui. Consultez les indicateurs clés ou ouvrez un outil depuis les raccourcis ci-dessous.</p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <button onClick={() => router.push('/dashboard/documents/ajouter')} className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-900/40 transition hover:bg-blue-500">
                  <Plus size={16} /> Nouveau document
                </button>
                {(role === 'admin' || role === 'librarian') && (
                  <button onClick={() => router.push('/dashboard/utilisateurs/demandes')} className="inline-flex items-center gap-2 rounded-lg border border-slate-600 px-4 py-2.5 text-sm font-semibold text-slate-200 transition hover:bg-slate-800">
                    <Inbox size={16} /> Demandes
                  </button>
                )}
              </div>
            </div>
          </section>

          {/* STATS */}
          <DashboardStatsGrid stats={stats} icons={{ documents: FileText, availableCopies: Archive, activeLoans: Clock3, members: Users }} />

          {/* ACCES RAPIDE */}
          <section>
            <div className="mb-4 flex items-end justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold">Accès rapide</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">Les outils essentiels de votre bibliothèque.</p>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {visibleLinks.map((link) => {
                const Icon = link.icon
                return (
                  <button
                    key={link.href}
                    onClick={() => router.push(link.href)}
                    className="group flex items-center gap-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 text-left transition-all hover:-translate-y-0.5 hover:shadow-lg"
                  >
                    <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-lg transition-transform group-hover:scale-110 ${QUICK_TONES[link.tone]}`}>
                      <Icon size={19} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <b className="block text-sm text-slate-900 dark:text-slate-100">{link.label}</b>
                      <span className="block truncate text-xs text-slate-500 dark:text-slate-400">{link.desc}</span>
                    </span>
                    <Sparkles size={15} className="shrink-0 text-slate-300 transition-all group-hover:translate-x-0.5 group-hover:text-blue-500 dark:text-slate-600" />
                  </button>
                )
              })}
            </div>
          </section>

          {/* LOWER GRID */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <ActivityPanel activities={activities} />

            <section className="relative overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="font-semibold">Biblius intelligence</h2>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Votre assistant de pilotage.</p>
                </div>
                <div className="grid h-9 w-9 place-items-center rounded-full bg-violet-100 text-violet-600 dark:bg-violet-900/30 dark:text-violet-300">
                  <Sparkles size={16} />
                </div>
              </div>
              <div className="space-y-4">
                <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                  Posez vos questions sur le catalogue, les ressources numériques ou la circulation. L’assistant vocal est disponible directement dans le chat.
                </p>
                <button onClick={() => router.push('/dashboard/agent-ia')} className="inline-flex items-center gap-2 rounded-lg bg-violet-100 px-4 py-2 text-sm font-semibold text-violet-700 transition hover:bg-violet-200 dark:bg-violet-900/40 dark:text-violet-300 dark:hover:bg-violet-900/60">
                  <Bot size={15} /> Ouvrir l’Agent IA
                </button>
              </div>
              <div aria-hidden="true" className="absolute inset-x-0 bottom-0 flex h-1">
                {[...Array(6)].map((_, i) => (
                  <span key={i} className="flex-1 bg-violet-500/80 animate-pulse" style={{ animationDelay: `${i * 0.2}s` }} />
                ))}
              </div>
            </section>
          </div>

          {/* RAPPORTS */}
          <section className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6">
            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                <h2 className="font-semibold">Rapports & analyse</h2>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Représentation graphique des données de la bibliothèque.</p>
              </div>
              <button onClick={() => router.push('/dashboard/rapports')} className="flex items-center gap-1 text-sm font-medium text-blue-600 hover:underline dark:text-blue-400">
                Voir tous les rapports →
              </button>
            </div>
            <RapportsView variant="compact" />
          </section>

          <footer className="mt-12 flex flex-wrap items-center gap-4 border-t border-slate-200 pb-2 pt-6 text-xs text-slate-500 dark:border-slate-800 dark:text-slate-400">
            <span>Biblius v0.1</span>
            <span>•</span>
            <span>Propulsé par Supabase</span>
            <span className="ml-auto flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
              <i className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" /> Données en temps réel
            </span>
          </footer>
        </div>
      </section>
    </main>
  )
}