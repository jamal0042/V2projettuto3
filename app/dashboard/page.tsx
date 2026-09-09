    'use client'

    import { useEffect, useState } from 'react'
    import {
    Archive, BarChart3, Bell, BookOpen, Bot, ChevronDown, CircleHelp, Clock3,
    Database, FileText, LayoutDashboard, Library, LogOut, MoreHorizontal,
    Plus, Settings, ShieldCheck, Sparkles, Users, X
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
        { label: 'Bibliothèque numérique', icon: Library, href: '/dashboard/ressources-numeriques', roles: ['admin', 'librarian', 'teacher', 'student', 'external'] }
        ] 
    },
    { 
        label: 'Catalogue', 
        items: [
        { label: 'Exemplaires', icon: Archive, href: '/dashboard/exemplaires', roles: ['admin', 'librarian'] }, 
        { label: 'Auteurs', icon: Users, href: '/dashboard/auteurs', roles: ['admin', 'librarian'] }, 
        { label: 'Classifications', icon: Database, href: '/dashboard/statistiques', roles: ['admin', 'librarian', 'teacher'] }, 
        { label: 'Emplacements', icon: ShieldCheck, href: '/dashboard/emplacements', roles: ['admin', 'librarian'] }
        ] 
    },
    { 
        label: 'Circulation', 
        items: [
        { label: 'Emprunts & retours', icon: Clock3, href: '/dashboard/prets', roles: ['admin', 'librarian'] }, 
        { label: 'Réservations', icon: BookOpen, href: '/dashboard/reservations', roles: ['admin', 'librarian', 'teacher', 'student', 'external'] }, 
        { label: 'Pénalités', icon: Bell, href: '/dashboard/penalites', roles: ['admin', 'librarian'] }
        ] 
    },
    { 
        label: 'Administration', 
        items: [
        { label: 'Utilisateurs', icon: Users, href: '/dashboard/utilisateurs', roles: ['admin', 'librarian'] }
        ] 
    },
    { 
        label: 'Rapports', 
        items: [
        { label: 'Rapports', icon: BarChart3, href: '/dashboard/rapports' }
        ] 
    },
    ]

    const modules = [
    { title: 'Paper Reader', detail: 'Catalogue intelligent', icon: FileText, tone: 'blue' },
    { title: 'Fluid Studio', detail: 'Collections en mouvement', icon: Sparkles, tone: 'amber' },
    { title: 'Ops Terminal', detail: 'Activité de la bibliothèque', icon: Database, tone: 'slate' },
    { title: 'Agent Mesh', detail: 'Assistants connectés', icon: Bot, tone: 'violet' },
    ]

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

    const getToneClasses = (tone: string) => {
        switch (tone) {
        case 'blue': return 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400 group-hover:border-blue-500'
        case 'amber': return 'bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400 group-hover:border-amber-500'
        case 'slate': return 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 group-hover:border-slate-500'
        case 'violet': return 'bg-violet-50 text-violet-600 dark:bg-violet-900/20 dark:text-violet-400 group-hover:border-violet-500'
        default: return 'bg-slate-100 text-slate-600'
        }
    }

    return (
        <main className={`${dark ? 'dark min-h-screen bg-slate-950 text-slate-100' : 'min-h-screen bg-slate-50 text-slate-900'} transition-colors duration-300 flex`} suppressHydrationWarning>
        <DashboardSidebar groups={filterDashboardGroups(navGroups, role)} active={active} open={sidebarOpen} onNavigate={(label, href) => { setActive(label); setSidebarOpen(false); router.push(href) }} onClose={() => setSidebarOpen(false)} onLogout={handleLogout} onSettings={() => router.push('/dashboard/parametres')} onHelp={() => router.push('/dashboard/agent-ia')} role={role} member={member} />

        {/* SIDEBAR */}
        <div className="hidden">
            <div className="flex items-center gap-3 p-4 border-b border-slate-200 dark:border-slate-800">
            <div className="w-8 h-8 bg-blue-600 text-white rounded-lg flex items-center justify-center">
                <Library size={18} strokeWidth={2.5} />
            </div>
            <div className="flex-1">
                <strong className="block text-sm">Biblius</strong>
                <span className="text-xs text-slate-500 dark:text-slate-400">Library OS</span>
            </div>
            <button className="lg:hidden p-1 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded" onClick={() => setSidebarOpen(false)}>
                <X size={17} />
            </button>
            </div>

            <div className="flex items-center gap-3 p-3 mx-4 mt-4 mb-2 bg-slate-100 dark:bg-slate-800 rounded-xl cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-700 transition">
            <div className="w-8 h-8 bg-amber-500 text-white rounded-full flex items-center justify-center font-bold text-sm">U</div>
            <div className="flex-1 min-w-0">
                <b className="block text-sm truncate">Université Adventiste de lukanga</b>
                <span className="text-xs text-slate-500 dark:text-slate-400 truncate block">Bibliothèque centrale</span>
            </div>
            <ChevronDown size={15} className="text-slate-400" />
            </div>

            <nav className="flex-1 overflow-y-auto px-4 py-4 space-y-6" aria-label="Navigation principale">
            {navGroups.map((group) => (
                <div key={group.label} className="space-y-1">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-3 mb-2 block">{group.label}</span>
                {group.items.map((item) => {
                    const Icon = item.icon
                    const isActive = active === item.label
                    return (
                    <button 
                        key={item.label} 
                        className={`w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition ${
                        isActive 
                            ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' 
                            : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                        }`}
                        onClick={() => { setActive(item.label); setSidebarOpen(false); router.push(item.href) }}
                    >
                        <Icon size={16} />
                        <span>{item.label}</span>
                    </button>
                    )
                })}
                </div>
            ))}
            </nav>

            <div className="p-4 border-t border-slate-200 dark:border-slate-800 space-y-1">
            <button onClick={() => router.push('/dashboard/parametres')} className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition">
                <Settings size={16} /><span>Paramètres</span>
            </button>
            <button onClick={() => router.push('/dashboard/agent-ia')} className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition">
                <CircleHelp size={16} /><span>Centre d&apos;aide</span>
            </button>
            <button className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium text-red-600 dark:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition" onClick={handleLogout}>
                <LogOut size={16} /><span>Se déconnecter</span>
            </button>
            
            <div className="flex items-center gap-3 p-2 mt-4 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition">
                <div className="w-8 h-8 bg-slate-200 dark:bg-slate-700 rounded-full flex items-center justify-center text-xs font-bold">MC</div>
                <div className="flex-1 min-w-0">
                <b className="block text-sm truncate">Jamal Faraja</b>
                <span className="text-xs text-slate-500 dark:text-slate-400 truncate block">Administratrice</span>
                </div>
                <MoreHorizontal size={16} className="text-slate-400" />
            </div>
            </div>
        </div>

        {/* MAIN COLUMN */}
        <section className="flex-1 lg:ml-64 flex flex-col min-h-screen">
            {/* TOPBAR */}
            <DashboardTopbar active={active} dark={dark} onMenu={() => setSidebarOpen(true)} onToggleTheme={() => { const next = !dark; setDark(next); window.localStorage.setItem('biblius-dashboard-theme', next ? 'dark' : 'light') }} initials={member ? `${member.first_name[0]?.toUpperCase() || ''}${member.last_name[0]?.toUpperCase() || ''}` : ''} />

            {/* CONTENT */}
            <div className="flex-1 p-6 lg:p-8 space-y-8">
            {/* Welcome Row */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                <p className="flex items-center gap-2 text-sm font-medium text-emerald-600 dark:text-emerald-400 mb-1">
                    <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" /> Système opérationnel
                </p>
                <h1 className="text-2xl font-bold">Bonjour, {member?.first_name || '…'}.</h1>
                <p className="text-slate-500 dark:text-slate-400 mt-1">Voici ce qui se passe dans votre bibliothèque aujourd&apos;hui.</p>
                </div>
                <button onClick={() => router.push('/dashboard/documents/ajouter')} className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition shadow-sm">
                <Plus size={16} /> Nouveau document
                </button>
            </div>

            {/* Stats Grid */}
            <DashboardStatsGrid stats={stats} icons={{ documents: FileText, availableCopies: Archive, activeLoans: Clock3, members: Users }} />

            {/* Modules Section */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                <h2 className="text-lg font-bold">Votre espace de travail</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">Des outils conçus pour une gestion documentaire fluide.</p>
                </div>
                <button className="flex items-center gap-1 text-sm text-blue-600 dark:text-blue-400 font-medium hover:underline">
                Voir tous les modules <ChevronDown size={15} className="transition-transform hover:rotate-180" />
                </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {modules.map((module, index) => {
                const Icon = module.icon
                return (
                    <button 
                    key={module.title} 
                    className={`group relative p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-left transition-all hover:shadow-lg hover:-translate-y-1 ${getToneClasses(module.tone)}`}
                    style={{ animationDelay: `${index * 80}ms` }}
                    onClick={() => setActive(module.title)}
                    >
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 ${getToneClasses(module.tone).split(' ').slice(0, 3).join(' ')}`}>
                        <Icon size={19} />
                    </div>
                    <div>
                        <h3 className="font-semibold text-slate-900 dark:text-slate-100">{module.title}</h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{module.detail}</p>
                    </div>
                    <span className="absolute top-5 right-5 text-slate-400 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform">↗</span>
                    </button>
                )
                })}
            </div>

            {/* Lower Grid: Activity & Insight */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Activity Panel */}
                <ActivityPanel activities={activities} />
                <section className="hidden lg:col-span-2 p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl">
                <div className="flex items-start justify-between mb-4">
                    <div>
                    <h2 className="font-semibold">Activité récente</h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Les dernières actions de votre espace.</p>
                    </div>
                    <button className="p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded">
                    <MoreHorizontal size={18} />
                    </button>
                </div>
                {activities.length > 0 ? (
                <div className="space-y-3">
                    {activities.map((activity) => (
                    <div key={activity.id} className="flex items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-3 last:border-0 last:pb-0">
                        <div className="min-w-0">
                        <b className="block truncate text-sm text-slate-900 dark:text-slate-100">{activity.action}</b>
                        <span className="text-xs text-slate-500 dark:text-slate-400">{activity.entity || 'Bibliothèque'}</span>
                        </div>
                        <time className="shrink-0 text-xs text-slate-400 dark:text-slate-500">{formatActivityDate(activity.created_at)}</time>
                    </div>
                    ))}
                </div>
                ) : <div className="flex flex-col items-center justify-center py-12 text-center text-slate-500 dark:text-slate-400">
                    <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-3">
                    <Database size={20} />
                    </div>
                    <b className="text-slate-900 dark:text-slate-100">Aucune activité pour le moment</b>
                    <span className="text-sm mt-1">Les événements de votre bibliothèque apparaîtront ici.</span>
                </div>}
                </section>

                {/* Insight Panel */}
                <section className="relative p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
                <div className="flex items-start justify-between mb-4">
                    <div>
                    <h2 className="font-semibold">Biblius intelligence</h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Votre assistant de pilotage.</p>
                    </div>
                    <div className="w-8 h-8 bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-full flex items-center justify-center">
                    <Sparkles size={15} />
                    </div>
                </div>
                <div className="space-y-4 relative z-10">
                    <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                    Connectez votre base pour découvrir vos tendances de prêt, les documents populaires et les actions prioritaires.
                    </p>
                    <button className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-sm font-medium rounded-lg transition">
                    Configurer la connexion <ChevronDown size={15} className="transition-transform hover:-rotate-180" />
                    </button>
                </div>
                
                {/* Animated Signal Line */}
                <div className="absolute bottom-0 left-0 right-0 h-1 flex">
                    {[...Array(6)].map((_, i) => (
                    <span key={i} className="flex-1 bg-blue-500 animate-pulse" style={{ animationDelay: `${i * 0.2}s` }} />
                    ))}
                </div>
                </section>
            </div>

            {/* Rapports & Analyses */}
            <section className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl">
                <div className="mb-4 flex items-start justify-between gap-4">
                <div>
                    <h2 className="font-semibold">Rapports & analyse</h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Représentation graphique des données de la bibliothèque.</p>
                </div>
                <button onClick={() => router.push('/dashboard/rapports')} className="flex items-center gap-1 text-sm text-blue-600 dark:text-blue-400 font-medium hover:underline">
                    Voir tous les rapports →
                </button>
                </div>
                <RapportsView variant="compact" />
            </section>

            {/* Footer */}
            <footer className="mt-12 pt-6 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
                <span>Biblius v0.1</span>
                <span>•</span>
                <span>Propulsé par Supabase</span>
                <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 ml-auto">
                <i className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" /> Données en temps réel
                </span>
            </footer>
            </div>
        </section>
        </main>
    )
    }

    // Composant StatCard isolé pour la propreté du code
    function StatCard({ label, value, note, icon: Icon }: { label: string; value: string; note: string; icon: any }) {
    return (
        <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl transition hover:shadow-md">
        <div className="flex items-center justify-between text-sm text-slate-500 dark:text-slate-400 mb-2">
            <span>{label}</span>
            <Icon size={16} />
        </div>
        <strong className="text-2xl font-bold text-slate-900 dark:text-slate-100 block">{value}</strong>
        <small className="text-xs text-slate-400 dark:text-slate-500 mt-1 block">{note}</small>
        </div>
    )
    }

    function formatStat(value: number | null) {
    return value === null ? '—' : value.toLocaleString('fr-FR')
    }

    function formatActivityDate(value: string) {
    return new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: 'short' }).format(new Date(value))
    }