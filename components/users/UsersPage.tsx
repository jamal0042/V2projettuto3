'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  CircleAlert,
  Clock3,
  Inbox,
  Loader2,
  Mail,
  MoreHorizontal,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  UserCheck,
  UserMinus,
  UserPlus,
  Users,
} from 'lucide-react'
import DashboardFrame from '@/components/dashboard/dashboard-frame'
import { Button, EmptyState, Modal, Select, inputClass } from './ui'
import { RoleBadge, StatusBadge } from './badges'
import {
  ROLE_FILTERS,
  STATUS_FILTERS,
  avatarColor,
  formatDate,
  formatDateTime,
  getInitials,
  type Member,
} from './user-types'

type Banner = { type: 'success' | 'error'; message: string } | null

const ACTION_LABELS: Record<string, string> = {
  active: 'Activer',
  suspended: 'Suspendre',
  inactive: 'Désactiver',
  resend: 'Renvoyer lʼinvitation',
  delete: 'Supprimer',
}

function availableActions(m: Member): { value: string; label: string; danger?: boolean }[] {
  const actions: { value: string; label: string; danger?: boolean }[] = []
  if (m.role === 'admin' && m.status !== 'active') return []
  if (m.status === 'active') {
    actions.push({ value: 'suspended', label: 'Suspendre', danger: true })
    actions.push({ value: 'inactive', label: 'Désactiver', danger: true })
  } else if (m.status === 'suspended' || m.status === 'inactive') {
    actions.push({ value: 'active', label: 'Réactiver' })
  } else if (m.status === 'pending') {
    actions.push({ value: 'active', label: 'Activer' })
    if (m.invite_status !== 'accepted') actions.push({ value: 'resend', label: 'Renvoyer lʼinvitation' })
    actions.push({ value: 'inactive', label: 'Désactiver', danger: true })
  }
  if (m.role !== 'admin') actions.push({ value: 'delete', label: 'Supprimer', danger: true })
  return actions
}

export default function UsersPage() {
  const router = useRouter()
  const [rows, setRows] = useState<Member[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [search, setSearch] = useState('')
  const [searchDebounced, setSearchDebounced] = useState('')
  const [role, setRole] = useState('all')
  const [status, setStatus] = useState('all')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [banner, setBanner] = useState<Banner>(null)
  const [stats, setStats] = useState<Record<string, number | null>>({})
  const [openMenu, setOpenMenu] = useState<string | null>(null)
  const [confirm, setConfirm] = useState<{ title: string; description: string; action: string; member: Member } | null>(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setSearchDebounced(search), 400)
    return () => clearTimeout(t)
  }, [search])

  useEffect(() => {
    setPage(1)
  }, [searchDebounced, role, status])

  const loadStats = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/users/stats')
      const json = await res.json()
      if (res.ok && json.data) setStats(json.data)
    } catch {
      /* silencieux */
    }
  }, [])

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) })
      if (searchDebounced) params.set('search', searchDebounced)
      if (role !== 'all') params.set('role', role)
      if (status !== 'all') params.set('status', status)
      const res = await fetch(`/api/admin/users?${params.toString()}`)
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Erreur de chargement')
      setRows(json.data as Member[])
      setTotal(json.total ?? 0)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur de chargement')
    } finally {
      setLoading(false)
    }
  }, [page, pageSize, searchDebounced, role, status])

  useEffect(() => {
    load()
  }, [load])

  useEffect(() => {
    loadStats()
  }, [loadStats])

  useEffect(() => {
    const close = () => setOpenMenu(null)
    document.addEventListener('click', close)
    return () => document.removeEventListener('click', close)
  }, [])

  const pick = (text: string) => {
    if (!navigator.clipboard || !text) return
    navigator.clipboard.writeText(text).catch(() => {})
  }

  async function runAction(member: Member, action: string) {
    setBusy(true)
    setBanner(null)
    try {
      if (action === 'resend') {
        const res = await fetch(`/api/admin/users/${member.id}/invitation`, { method: 'POST' })
        const json = await res.json()
        if (!res.ok) throw new Error(json.error || 'Échec du renvoi')
        if (json.invitation.sent) {
          setBanner({ type: 'success', message: `Email dʼactivation renvoyé à ${member.email}.` })
        } else {
          setBanner({ type: 'error', message: 'Compte invité mais email non envoyé (fournisseur dʼemail non configuré).' })
        }
      } else if (action === 'delete') {
        const res = await fetch(`/api/admin/users/${member.id}`, { method: 'DELETE' })
        const json = await res.json().catch(() => ({}))
        if (!res.ok) throw new Error(json.error || 'Échec de la suppression')
        setBanner({ type: 'success', message: 'Compte supprimé.' })
      } else {
        const res = await fetch(`/api/admin/users/${member.id}/status`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ value: action }),
        })
        const json = await res.json()
        if (!res.ok) throw new Error(json.error || 'Échec de lʼopération')
        setBanner({ type: 'success', message: `Compte ${ACTION_LABELS[action].toLowerCase()}.` })
      }
      setOpenMenu(null)
      load()
      loadStats()
    } catch (err) {
      setBanner({ type: 'error', message: err instanceof Error ? err.message : 'Erreur' })
    } finally {
      setBusy(false)
    }
  }

  const totalPages = Math.max(1, Math.ceil(total / pageSize))

  function renderActionMenu(m: Member) {
    if (openMenu !== m.id) {
      return <MoreHorizontal size={16} className="mx-auto text-slate-400" />
    }
    const actions = availableActions(m)
    return (
      <div
        className="absolute right-0 z-30 mt-1 w-52 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-lg p-1"
        onClick={(e) => e.stopPropagation()}
      >
        <Link
          href={`/dashboard/utilisateurs/${m.id}`}
          className="flex items-center gap-2 px-3 py-2 text-sm text-slate-700 dark:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          onClick={() => setOpenMenu(null)}
        >
          <UserCheck size={14} /> Consulter / modifier
        </Link>
        {actions.map((action) => {
          const ActionIcon = action.value === 'resend' ? RefreshCw : action.value === 'delete' ? Trash2 : null
          return (
            <button
              key={action.value}
              className={`w-full flex items-center gap-2 px-3 py-2 text-sm rounded-lg transition text-left ${
                action.danger
                  ? 'text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20'
                  : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
              disabled={busy}
              onClick={() =>
                setConfirm({
                  title: ACTION_LABELS[action.value],
                  description:
                    action.value === 'delete'
                      ? `Supprimer définitivement le compte de ${m.first_name} ${m.last_name} ? Cette action est irréversible.`
                      : `Confirmer lʼopération « ${ACTION_LABELS[action.value].toLowerCase()} » pour ${m.first_name} ${m.last_name} ?`,
                  action: action.value,
                  member: m,
                })
              }
            >
              {ActionIcon ? <ActionIcon size={14} /> : null}
              {action.label}
            </button>
          )
        })}
      </div>
    )
  }

  return (
    <DashboardFrame active="Utilisateurs">
      <main className="mx-auto max-w-7xl p-6 lg:p-8">
        <div className="mb-6 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <p className="mb-1 flex items-center gap-2 text-sm font-medium text-emerald-600 dark:text-emerald-400">
              <span className="h-2 w-2 rounded-full bg-emerald-500" /> Gestion des comptes
            </p>
            <h1 className="text-2xl font-bold">Utilisateurs</h1>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Créez, validez, activez, suspendez et réactivez les comptes de la bibliothèque.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard/utilisateurs/demandes"
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition"
            >
              <Inbox size={16} />
              Demandes
              {typeof stats.demandes === 'number' && stats.demandes > 0 && (
                <span className="ml-0.5 inline-flex items-center justify-center min-w-5 h-5 px-1.5 text-[11px] font-bold text-white bg-amber-500 rounded-full">
                  {stats.demandes}
                </span>
              )}
            </Link>
            <Link
              href="/dashboard/utilisateurs/ajouter"
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition shadow-sm"
            >
              <Plus size={16} /> Ajouter un utilisateur
            </Link>
          </div>
        </div>

        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Comptes actifs', value: stats.actifs, icon: UserCheck, tone: 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20' },
            { label: 'Invitations en attente', value: stats.invitations, icon: Mail, tone: 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20' },
            { label: 'Comptes suspendus', value: stats.suspendus, icon: UserMinus, tone: 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20' },
            { label: 'Demandes dʼinscription', value: stats.demandes, icon: UserPlus, tone: 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20' },
          ].map((card) => {
            const Icon = card.icon
            return (
              <div key={card.label} className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl">
                <div className="flex items-center justify-between text-sm text-slate-500 dark:text-slate-400 mb-2">
                  <span>{card.label}</span>
                  <span className={`w-8 h-8 rounded-lg flex items-center justify-center ${card.tone}`}>
                    <Icon size={16} />
                  </span>
                </div>
                <strong className="text-2xl font-bold block">
                  {card.value === null || card.value === undefined ? '—' : card.value}
                </strong>
                <small className="text-xs text-slate-400 dark:text-slate-500 mt-1 block">
                  {card.label === 'Demandes dʼinscription' ? 'En attente de validation' : 'Données temps réel'}
                </small>
              </div>
            )
          })}
        </section>

        <div className="flex flex-wrap items-center gap-2 mb-4">
          <span className="text-xs text-slate-400 dark:text-slate-500">
            Étudiants : <b className="text-slate-600 dark:text-slate-300">{stats.etudiants ?? '—'}</b>
          </span>
          <span className="text-sm text-slate-300 dark:text-slate-600">•</span>
          <span className="text-xs text-slate-400 dark:text-slate-500">
            Externes : <b className="text-slate-600 dark:text-slate-300">{stats.externes ?? '—'}</b>
          </span>
          <span className="text-sm text-slate-300 dark:text-slate-600">•</span>
          <span className="text-xs text-slate-400 dark:text-slate-500">
            Invitations expirées : <b className="text-slate-600 dark:text-slate-300">{stats.expirees ?? '—'}</b>
          </span>
        </div>

        {banner && (
          <div
            className={`mb-4 flex items-center gap-2 px-4 py-3 rounded-lg text-sm ${
              banner.type === 'success'
                ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300'
                : 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-300'
            }`}
          >
            {banner.type === 'success' ? <CheckCircle2 size={16} /> : <CircleAlert size={16} />}
            {banner.message}
          </div>
        )}

        <section className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <div className="flex flex-col md:flex-row md:items-center gap-3 p-4 border-b border-slate-200 dark:border-slate-800">
            <div className="relative flex-1">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Rechercher par nom, prénom ou email…"
                className={`${inputClass} pl-9`}
              />
            </div>
            <Select value={role} onChange={(e) => setRole(e.target.value)} className="md:w-48">
              {ROLE_FILTERS.map((f) => (
                <option key={f.value} value={f.value}>
                  {f.label}
                </option>
              ))}
            </Select>
            <Select value={status} onChange={(e) => setStatus(e.target.value)} className="md:w-48">
              {STATUS_FILTERS.map((f) => (
                <option key={f.value} value={f.value}>
                  {f.label}
                </option>
              ))}
            </Select>
          </div>

          {loading ? (
            <div className="flex items-center justify-center gap-2 p-14 text-sm text-slate-500 dark:text-slate-400">
              <Loader2 size={18} className="animate-spin" /> Chargement des utilisateurs…
            </div>
          ) : error ? (
            <div className="p-10 text-center text-sm text-red-600 dark:text-red-400">{error}</div>
          ) : rows.length === 0 ? (
            <EmptyState
              icon={<Users size={20} />}
              title="Aucun utilisateur trouvé"
              description="Ajustez vos filtres ou créez un nouveau compte utilisateur."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950">
                  <tr>
                    {['Utilisateur', 'Type', 'Statut', 'Dernière connexion', 'Créé le', ''].map((h) => (
                      <th key={h} className="whitespace-nowrap px-5 py-3 font-semibold text-slate-500 dark:text-slate-400">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((m) => (
                    <tr
                      key={m.id}
                      className="border-b border-slate-100 last:border-0 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-950/60 transition cursor-pointer"
                      onClick={() => router.push(`/dashboard/utilisateurs/${m.id}`)}
                    >
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
                            style={{ backgroundColor: avatarColor(`${m.first_name} ${m.last_name}`) }}
                          >
                            {getInitials(m.first_name, m.last_name)}
                          </div>
                          <div className="min-w-0">
                            <b className="block truncate text-slate-800 dark:text-slate-200">
                              {m.first_name} {m.last_name}
                            </b>
                            <button
                              onClick={() => pick(m.email || '')}
                              title="Copier lʼemail"
                              className="block truncate text-xs text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition"
                            >
                              {m.email || '—'}
                            </button>
                          </div>
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-5 py-3">
                        <RoleBadge role={m.role} />
                      </td>
                      <td className="whitespace-nowrap px-5 py-3">
                        <StatusBadge member={m} />
                      </td>
                      <td className="whitespace-nowrap px-5 py-3 text-slate-600 dark:text-slate-300">
                        {m.last_sign_in_at ? (
                          <span className="inline-flex items-center gap-1.5">
                            <Clock3 size={13} className="text-slate-400" />
                            {formatDateTime(m.last_sign_in_at)}
                          </span>
                        ) : (
                          <span className="text-slate-400 dark:text-slate-500">Jamais</span>
                        )}
                      </td>
                      <td className="whitespace-nowrap px-5 py-3 text-slate-600 dark:text-slate-300">{formatDate(m.created_at)}</td>
                      <td className="relative whitespace-nowrap px-5 py-3 text-right">
                        <button
                          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                          aria-label="Actions"
                          onClick={(e) => {
                            e.stopPropagation()
                            setOpenMenu(openMenu === m.id ? null : m.id)
                          }}
                        >
                          {renderActionMenu(m)}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 border-t border-slate-200 dark:border-slate-800">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {total} utilisateur(s) · page {page} / {totalPages}
            </p>
            <div className="flex items-center gap-3">
              <Select value={pageSize} onChange={(e) => setPageSize(Number(e.target.value))} className="w-28">
                {[10, 20, 30, 50].map((n) => (
                  <option key={n} value={n}>
                    {n} / page
                  </option>
                ))}
              </Select>
              <Button variant="secondary" size="sm" disabled={page <= 1 || loading} onClick={() => setPage((p) => p - 1)}>
                <ChevronLeft size={14} /> Précédent
              </Button>
              <Button variant="secondary" size="sm" disabled={page >= totalPages || loading} onClick={() => setPage((p) => p + 1)}>
                Suivant <ChevronRight size={14} />
              </Button>
            </div>
          </div>
        </section>

        <Modal
          open={Boolean(confirm)}
          onClose={() => setConfirm(null)}
          title={confirm ? ACTION_LABELS[confirm.action] : ''}
          description={confirm?.description}
          danger={confirm?.action === 'delete' || confirm?.action === 'suspended' || confirm?.action === 'inactive'}
          footer={
            <>
              <Button variant="ghost" onClick={() => setConfirm(null)} disabled={busy}>
                Annuler
              </Button>
              <Button
                variant={confirm?.action === 'delete' || confirm?.action === 'suspended' || confirm?.action === 'inactive' ? 'danger' : 'primary'}
                loading={busy}
                onClick={() => {
                  if (confirm) runAction(confirm.member, confirm.action)
                  setConfirm(null)
                }}
              >
                {confirm && confirm.action === 'delete' ? <Trash2 size={14} /> : null}
                Confirmer
              </Button>
            </>
          }
        />
      </main>
    </DashboardFrame>
  )
}