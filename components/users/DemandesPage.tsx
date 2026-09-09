'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, CheckCircle2, CircleAlert, Loader2, Mail, RotateCcw, UserCheck, UserX } from 'lucide-react'
import DashboardFrame from '@/components/dashboard/dashboard-frame'
import { Button, EmptyState, Select } from './ui'
import { formatDate, getInitials, avatarColor, type MembershipRequest } from './user-types'

type Banner = { type: 'success' | 'error'; message: string } | null

export default function DemandesPage() {
  const [rows, setRows] = useState<MembershipRequest[]>([])
  const [status, setStatus] = useState('pending')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [banner, setBanner] = useState<Banner>(null)
  const [busyId, setBusyId] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`/api/admin/users/demandes?status=${status}`)
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Erreur de chargement')
      setRows(json.data as MembershipRequest[])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur de chargement')
    } finally {
      setLoading(false)
    }
  }, [status])

  useEffect(() => {
    load()
  }, [load])

  async function handleAction(req: MembershipRequest, action: 'accept' | 'reject') {
    setBusyId(req.id)
    setBanner(null)
    try {
      const res = await fetch('/api/admin/users/demandes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: req.id, action }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || `Échec de l’opération`)
      if (action === 'accept') {
        setBanner({
          type: 'success',
          message: json.invitation?.sent
            ? `Compte créé pour ${json.member.email}. Un email de confirmation a été envoyé au propriétaire du compte.`
            : `Compte créé pour ${json.member.email}, mais l’email d’activation n’a pas pu être envoyé (fournisseur non configuré).`,
        })
      } else {
        setBanner({ type: 'success', message: `Demande de ${req.first_name} ${req.last_name} refusée.` })
      }
      load()
    } catch (err) {
      setBanner({ type: 'error', message: err instanceof Error ? err.message : 'Erreur' })
    } finally {
      setBusyId(null)
    }
  }

  return (
    <DashboardFrame active="Utilisateurs">
      <main className="mx-auto max-w-5xl p-6 lg:p-8">
        <Link
          href="/dashboard/utilisateurs"
          className="inline-flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition mb-4"
        >
          <ArrowLeft size={15} /> Retour aux utilisateurs
        </Link>

        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <p className="mb-1 flex items-center gap-2 text-sm font-medium text-emerald-600 dark:text-emerald-400">
              <span className="h-2 w-2 rounded-full bg-emerald-500" /> Inscriptions en attente
            </p>
            <h1 className="text-2xl font-bold">Demandes d’inscription</h1>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Confirmez ou refusez les comptes étudiants / externes qui se sont inscrits.
            </p>
          </div>
          <Select value={status} onChange={(e) => setStatus(e.target.value)} className="md:w-48">
            <option value="pending">En attente</option>
            <option value="approved">Approuvées</option>
            <option value="rejected">Refusées</option>
            <option value="archived">Archivées</option>
            <option value="all">Toutes</option>
          </Select>
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
          {loading ? (
            <div className="flex items-center justify-center gap-2 p-14 text-sm text-slate-500 dark:text-slate-400">
              <Loader2 size={18} className="animate-spin" /> Chargement des demandes…
            </div>
          ) : error ? (
            <div className="p-10 text-center text-sm text-red-600 dark:text-red-400">{error}</div>
          ) : rows.length === 0 ? (
            <EmptyState
              icon={<Mail size={20} />}
              title="Aucune demande"
              description="Les demandes d’inscription des étudiants apparaîtront ici pour validation."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950">
                  <tr>
                    {['Demandeur', 'Email', 'Type', 'Reçu le', 'Actions'].map((h) => (
                      <th key={h} className="whitespace-nowrap px-5 py-3 font-semibold text-slate-500 dark:text-slate-400">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((req) => (
                    <tr key={req.id} className="border-b border-slate-100 last:border-0 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-950/60 transition">
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
                            style={{ backgroundColor: avatarColor(`${req.first_name} ${req.last_name}`) }}
                          >
                            {getInitials(req.first_name, req.last_name)}
                          </div>
                          <div className="min-w-0">
                            <b className="block truncate text-slate-800 dark:text-slate-200">
                              {req.first_name} {req.last_name}
                            </b>
                            {req.department && <span className="block truncate text-xs text-slate-500 dark:text-slate-400">{req.department} · {req.level || '—'}</span>}
                          </div>
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-5 py-3 text-slate-600 dark:text-slate-300">{req.email}</td>
                      <td className="whitespace-nowrap px-5 py-3">
                        <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
                          {req.account_type === 'external' ? 'Externe' : 'Étudiant'}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-5 py-3 text-slate-600 dark:text-slate-300">{formatDate(req.created_at)}</td>
                      <td className="whitespace-nowrap px-5 py-3">
                        {req.status === 'pending' ? (
                          <div className="flex items-center gap-2">
                            <Button variant="success" size="sm" loading={busyId === req.id} onClick={() => handleAction(req, 'accept')}>
                              {busyId === req.id ? null : <UserCheck size={14} />} Confirmer
                            </Button>
                            <Button variant="ghost" size="sm" disabled={busyId === req.id} onClick={() => handleAction(req, 'reject')}>
                              {busyId === req.id ? null : <UserX size={14} />} Refuser
                            </Button>
                          </div>
                        ) : (
                          <span className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-semibold ${req.status === 'approved' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300' : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'}`}>
                            {req.status === 'approved' ? <CheckCircle2 size={12} /> : <RotateCcw size={12} />}
                            {req.status === 'approved' ? 'Approuvée' : req.status === 'rejected' ? 'Refusée' : req.status === 'archived' ? 'Archivée' : req.status}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>
    </DashboardFrame>
  )
}