import { Database, MoreHorizontal, type LucideIcon } from 'lucide-react'
import type { DashboardActivity, DashboardStats } from './dashboard-types'

const TONES: Record<string, { chip: string; text: string }> = {
  blue: { chip: 'bg-blue-50 text-blue-600 dark:bg-blue-900/25 dark:text-blue-300', text: 'text-blue-600 dark:text-blue-400' },
  emerald: { chip: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/25 dark:text-emerald-300', text: 'text-emerald-600 dark:text-emerald-400' },
  amber: { chip: 'bg-amber-50 text-amber-600 dark:bg-amber-900/25 dark:text-amber-300', text: 'text-amber-600 dark:text-amber-400' },
  violet: { chip: 'bg-violet-50 text-violet-600 dark:bg-violet-900/25 dark:text-violet-300', text: 'text-violet-600 dark:text-violet-400' },
}

export function StatCard({ label, value, note, icon: Icon, tone = 'blue' }: { label: string; value: string; note: string; icon: LucideIcon; tone?: keyof typeof TONES }) {
  const t = TONES[tone] || TONES.blue
  return (
    <div className="group relative overflow-hidden p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl transition-all hover:shadow-lg hover:-translate-y-0.5">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-medium text-slate-500 dark:text-slate-400">{label}</span>
        <span className={`grid h-9 w-9 place-items-center rounded-lg transition-transform group-hover:scale-110 ${t.chip}`}>
          <Icon size={17} />
        </span>
      </div>
      <strong className={`text-3xl font-extrabold tracking-tight ${t.text} block`}>{value}</strong>
      <small className="mt-1.5 block text-xs text-slate-400 dark:text-slate-500">{note}</small>
      <span className="absolute inset-x-0 bottom-0 h-0.5 bg-gradient-to-r from-transparent via-blue-500/40 to-transparent opacity-0 transition-opacity group-hover:opacity-100" aria-hidden="true" />
    </div>
  )
}

export function DashboardStatsGrid({ stats, icons }: { stats: DashboardStats; icons: { documents: LucideIcon; availableCopies: LucideIcon; activeLoans: LucideIcon; members: LucideIcon } }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard label="Documents catalogués" value={formatStat(stats.documents)} note={stats.documents === null ? 'Données non synchronisées' : 'Total du fonds documentaire'} icon={icons.documents} tone="blue" />
      <StatCard label="Exemplaires disponibles" value={formatStat(stats.availableCopies)} note={stats.availableCopies === null ? 'Données non synchronisées' : 'Prêts au catalogue immédiats'} icon={icons.availableCopies} tone="emerald" />
      <StatCard label="Emprunts actifs" value={formatStat(stats.activeLoans)} note={stats.activeLoans === null ? 'Données non synchronisées' : 'En cours de circulation'} icon={icons.activeLoans} tone="amber" />
      <StatCard label="Membres inscrits" value={formatStat(stats.members)} note={stats.members === null ? 'Données non synchronisées' : 'Comptes actifs de la bibliothèque'} icon={icons.members} tone="violet" />
    </div>
  )
}

export function ActivityPanel({ activities }: { activities: DashboardActivity[] }) {
  return (
    <section className="lg:col-span-2 p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h2 className="font-semibold">Activité récente</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">Les dernières actions de votre espace.</p>
        </div>
        <button className="p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded" aria-label="Options">
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
      ) : (
        <div className="flex flex-col items-center justify-center py-12 text-center text-slate-500 dark:text-slate-400">
          <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-3">
            <Database size={20} />
          </div>
          <b className="text-slate-900 dark:text-slate-100">Aucune activité pour le moment</b>
          <span className="text-sm mt-1">Les événements de votre bibliothèque apparaîtront ici.</span>
        </div>
      )}
    </section>
  )
}

function formatStat(value: number | null) {
  return value === null ? '—' : value.toLocaleString('fr-FR')
}
function formatActivityDate(value: string) {
  return new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: 'short' }).format(new Date(value))
}