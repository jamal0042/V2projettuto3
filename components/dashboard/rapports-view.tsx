'use client'

import { useEffect, useState } from 'react'
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts'
import { AlertTriangle, BarChart3, Loader2, Printer, RefreshCw } from 'lucide-react'

type Slice = { name: string; value: number }
type MonthPoint = { name: string; prets: number; retours: number }
type Kpis = Record<string, number>

type RapportData = {
  view: 'admin' | 'user'
  kpis: Kpis
  loansByMonth: MonthPoint[]
  documentsByCategory: Slice[]
  topDocuments: Slice[]
  membersByRole: Slice[]
  exemplairesByStatus: Slice[]
  reservationsByStatus: Slice[]
  penalitesByStatus: Slice[]
  myLoans?: Slice[]
  error?: string
  configured?: boolean
}

const PALETTE = ['#3b82f6', '#8b5cf6', '#f59e0b', '#10b981', '#ef4444', '#06b6d4', '#f43f5e', '#84cc16']

const KPI_LABELS: Record<string, string> = {
  prets: 'Emprunts',
  retours: 'Retours',
  documents: 'Documents',
  membres: 'Membres',
  exemplairesDisponibles: 'Exemplaires dispo.',
  reservationsEnAttente: 'Réserv. en attente',
  penalitesImpayees: 'Pénalités impayées',
  ressourcesNumeriques: 'Ressources numériques',
  emprunts: 'Vos emprunts',
  actifs: 'Actifs',
  retards: 'En retard',
  reservations: 'Vos réservations',
  penalitesTotal: 'Total pénalités (FCFA)',
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-10 text-center text-slate-500 dark:text-slate-400">
      <BarChart3 size={22} className="mb-2" />
      <span className="text-sm">{message}</span>
    </div>
  )
}

function ChartCard({
  title,
  subtitle,
  children,
  wide,
}: {
  title: string
  subtitle?: string
  children: React.ReactNode
  wide?: boolean
}) {
  return (
    <section
      className={`p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl ${wide ? 'col-span-1 lg:col-span-2' : ''}`}
    >
      <h3 className="font-semibold text-slate-900 dark:text-slate-100">{title}</h3>
      {subtitle ? <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{subtitle}</p> : null}
      <div className="mt-4">{children}</div>
    </section>
  )
}

export default function RapportsView({ variant = 'full' }: { variant?: 'full' | 'compact' }) {
  const [data, setData] = useState<RapportData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  async function load() {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/rapports')
      const json = await res.json().catch(() => null)
      if (!res.ok || !json) {
        setError(json?.error || `Erreur de chargement des rapports (${res.status}).`)
        setData(null)
        return
      }
      setData(json as RapportData)
    } catch {
      setError('Impossible de charger les rapports.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 p-12 text-sm text-slate-500">
        <Loader2 className="animate-spin" size={18} /> Chargement des rapports...
      </div>
    )
  }

  if (error && !data) {
    return (
      <div className="p-6 bg-white dark:bg-slate-900 border border-red-200 dark:border-red-900/50 rounded-xl text-sm text-red-600 dark:text-red-400">
        <AlertTriangle size={18} className="inline-block mr-2 -mt-0.5" />
        {error}
        <button onClick={load} className="ml-3 inline-flex items-center gap-1 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg text-xs font-medium">
          <RefreshCw size={13} /> Réessayer
        </button>
      </div>
    )
  }

  if (!data) return null

  const isAdmin = data.view === 'admin'
  const kpiEntries = Object.entries(data.kpis ?? {})

  return (
    <div className={variant === 'full' ? 'mx-auto max-w-7xl p-6 lg:p-8 space-y-6' : 'space-y-6'}>
      {variant === 'full' && (
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <p className="mb-1 flex items-center gap-2 text-sm font-medium text-emerald-600 dark:text-emerald-400">
              <span className="h-2 w-2 rounded-full bg-emerald-500" /> Rapports en temps réel
            </p>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              {isAdmin ? 'Rapports de la bibliothèque' : 'Vos rapports personnels'}
            </h1>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              {isAdmin
                ? 'Synthèse globale des activités de la bibliothèque.'
                : 'Votre activité personnelle d’emprunt et de réservation.'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => window.print()}
              className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-sm font-medium rounded-lg transition text-slate-700 dark:text-slate-200 print:hidden"
            >
              <Printer size={15} /> Imprimer
            </button>
            <button
              onClick={load}
              className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-sm font-medium rounded-lg transition text-slate-700 dark:text-slate-200 print:hidden"
            >
              <RefreshCw size={15} /> Actualiser
            </button>
          </div>
        </div>
      )}

      {(variant === 'full' && kpiEntries.length > 0) && (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {kpiEntries.map(([key, value]) => (
            <div key={key} className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl">
              <span className="text-sm text-slate-500 dark:text-slate-400 block">{KPI_LABELS[key] ?? key}</span>
              <strong className="text-2xl font-bold text-slate-900 dark:text-slate-100 block mt-1">
                {typeof value === 'number' ? value.toLocaleString('fr-FR') : '—'}
              </strong>
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard
          title={isAdmin ? 'Évolution des prêts et retours' : 'Vos emprunts par mois'}
          subtitle="Nombre de prêts (et retours) par mois"
          wide
        >
          {data.loansByMonth && data.loansByMonth.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={data.loansByMonth} margin={{ top: 5, right: 20, bottom: 5, left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" strokeOpacity={0.2} />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} stroke="#64748b" />
                <YAxis allowDecimals={false} tick={{ fontSize: 12 }} stroke="#64748b" />
                <Tooltip contentStyle={{ borderRadius: 12, background: '#0f172a', color: '#e2e8f0', border: '1px solid #334155' }} />
                <Legend />
                <Line type="monotone" dataKey="prets" name="Prêts" stroke="#3b82f6" strokeWidth={2.5} dot={{ r: 3 }} />
                {isAdmin ? (
                  <Line type="monotone" dataKey="retours" name="Retours" stroke="#10b981" strokeWidth={2.5} dot={{ r: 3 }} />
                ) : null}
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <EmptyState message="Aucune donnée pour le moment." />
          )}
        </ChartCard>

        <ChartCard
          title={isAdmin ? 'Documents les plus empruntés' : 'Vos catégories favorites'}
          subtitle={isAdmin ? 'Top 6 des documents par nombre d’emprunts' : 'Documents consultés par catégorie'}
        >
          {(data.topDocuments?.length > 0 || data.documentsByCategory?.length > 0) ? (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={isAdmin ? data.topDocuments : data.documentsByCategory} margin={{ top: 5, right: 20, bottom: 20, left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" strokeOpacity={0.2} />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} stroke="#64748b" interval={0} angle={-12} textAnchor="end" height={60} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12 }} stroke="#64748b" />
                <Tooltip contentStyle={{ borderRadius: 12, background: '#0f172a', color: '#e2e8f0', border: '1px solid #334155' }} />
                <Bar dataKey="value" name="Nombre" radius={[6, 6, 0, 0]}>
                  {(data.topDocuments?.length > 0 ? data.topDocuments : data.documentsByCategory).map((entry, index) => (
                    <Cell key={entry.name} fill={PALETTE[index % PALETTE.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <EmptyState message="Aucune donnée pour le moment." />
          )}
        </ChartCard>

        {isAdmin ? (
          <>
            <ChartCard title="Répartition des membres" subtitle="Par rôle">
              {data.membersByRole?.length > 0 ? (
                <ResponsiveContainer width="100%" height={260}>
                  <PieChart>
                    <Pie data={data.membersByRole} dataKey="value" nameKey="name" innerRadius={45} outerRadius={85} paddingAngle={2}>
                      {data.membersByRole.map((entry, index) => (
                        <Cell key={entry.name} fill={PALETTE[index % PALETTE.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: 12, background: '#0f172a', color: '#e2e8f0', border: '1px solid #334155' }} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <EmptyState message="Aucune donnée pour le moment." />
              )}
            </ChartCard>

            <ChartCard title="Répartition par catégorie" subtitle="Documents du catalogue">
              {data.documentsByCategory?.length > 0 ? (
                <ResponsiveContainer width="100%" height={260}>
                  <PieChart>
                    <Pie data={data.documentsByCategory} dataKey="value" nameKey="name" outerRadius={85} paddingAngle={2}>
                      {data.documentsByCategory.map((entry, index) => (
                        <Cell key={entry.name} fill={PALETTE[index % PALETTE.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: 12, background: '#0f172a', color: '#e2e8f0', border: '1px solid #334155' }} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <EmptyState message="Aucune donnée pour le moment." />
              )}
            </ChartCard>

            <ChartCard title="Statut des exemplaires" subtitle="Disponibilité du fonds">
              {data.exemplairesByStatus?.length > 0 ? (
                <ResponsiveContainer width="100%" height={260}>
                  <PieChart>
                    <Pie data={data.exemplairesByStatus} dataKey="value" nameKey="name" innerRadius={45} outerRadius={85} paddingAngle={2}>
                      {data.exemplairesByStatus.map((entry, index) => (
                        <Cell key={entry.name} fill={PALETTE[index % PALETTE.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: 12, background: '#0f172a', color: '#e2e8f0', border: '1px solid #334155' }} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <EmptyState message="Aucune donnée pour le moment." />
              )}
            </ChartCard>

            <ChartCard title="Réservations & pénalités" subtitle="Par statut">
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie data={data.reservationsByStatus} dataKey="value" nameKey="name" outerRadius={80} paddingAngle={2}>
                    {data.reservationsByStatus.map((entry, index) => (
                      <Cell key={entry.name} fill={PALETTE[index % PALETTE.length]} />
                    ))}
                  </Pie>
                  <Pie data={data.penalitesByStatus} dataKey="value" nameKey="name" innerRadius={95} outerRadius={115} paddingAngle={2}>
                    {data.penalitesByStatus.map((entry, index) => (
                      <Cell key={entry.name} fill={PALETTE[(index + 4) % PALETTE.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: 12, background: '#0f172a', color: '#e2e8f0', border: '1px solid #334155' }} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </ChartCard>
          </>
        ) : (
          <>
            <ChartCard title="Vos emprunts" subtitle="Par statut">
              {data.myLoans && data.myLoans.length > 0 ? (
                <ResponsiveContainer width="100%" height={260}>
                  <PieChart>
                    <Pie data={data.myLoans} dataKey="value" nameKey="name" innerRadius={45} outerRadius={85} paddingAngle={2}>
                      {data.myLoans.map((entry, index) => (
                        <Cell key={entry.name} fill={PALETTE[index % PALETTE.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: 12, background: '#0f172a', color: '#e2e8f0', border: '1px solid #334155' }} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <EmptyState message="Aucun emprunt pour le moment." />
              )}
            </ChartCard>

            <ChartCard title="Vos réservations" subtitle="Par statut">
              {data.reservationsByStatus?.length > 0 ? (
                <ResponsiveContainer width="100%" height={260}>
                  <PieChart>
                    <Pie data={data.reservationsByStatus} dataKey="value" nameKey="name" innerRadius={45} outerRadius={85} paddingAngle={2}>
                      {data.reservationsByStatus.map((entry, index) => (
                        <Cell key={entry.name} fill={PALETTE[index % PALETTE.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: 12, background: '#0f172a', color: '#e2e8f0', border: '1px solid #334155' }} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <EmptyState message="Aucune réservation pour le moment." />
              )}
            </ChartCard>

            <ChartCard title="Vos pénalités" subtitle="Par statut">
              {data.penalitesByStatus?.length > 0 ? (
                <ResponsiveContainer width="100%" height={260}>
                  <PieChart>
                    <Pie data={data.penalitesByStatus} dataKey="value" nameKey="name" outerRadius={85} paddingAngle={2}>
                      {data.penalitesByStatus.map((entry, index) => (
                        <Cell key={entry.name} fill={PALETTE[index % PALETTE.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: 12, background: '#0f172a', color: '#e2e8f0', border: '1px solid #334155' }} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <EmptyState message="Aucune pénalité." />
              )}
            </ChartCard>
          </>
        )}
      </div>
    </div>
  )
}