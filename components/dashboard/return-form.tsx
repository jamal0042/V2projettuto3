'use client'

import { FormEvent, useEffect, useMemo, useState } from 'react'
import { AlertCircle, ArrowLeft, BookOpen, Check, Loader2, Undo2 } from 'lucide-react'
import Link from 'next/link'

type ActiveLoan = {
  id: string
  member_id: string
  exemplaire_id: string
  due_date: string
  status: string
  members: { first_name: string | null; last_name: string | null; email: string | null } | null
  exemplaires: { barcode: string | null; cote_complete: string | null; documents: { title: string | null } | null } | null
}

const CONDITIONS: { value: string; label: string }[] = [
  { value: 'good', label: 'Bon état' },
  { value: 'damaged', label: 'Endommagé' },
  { value: 'lost', label: 'Perdu' },
]

function fmtDate(value: string) {
  if (!value) return '—'
  return new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(`${value}T00:00:00`))
}

function daysBetween(dueDate: string, returnDate: string) {
  const due = new Date(`${dueDate}T00:00:00`)
  const ret = new Date(returnDate)
  const diff = Math.round((ret.getTime() - due.getTime()) / 86400000)
  return Math.max(0, diff)
}

function todayValue() {
  return new Date().toISOString().slice(0, 10)
}

export default function ReturnForm() {
  const [loans, setLoans] = useState<ActiveLoan[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [pretId, setPretId] = useState('')
  const [bookCondition, setBookCondition] = useState('good')
  const [notes, setNotes] = useState('')
  const [returnDate, setReturnDate] = useState(todayValue())
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [banner, setBanner] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const load = async () => {
    setLoading(true)
    setLoadError('')
    try {
      const res = await fetch('/api/retours')
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Erreur de chargement')
      setLoans((json.data || []) as ActiveLoan[])
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : 'Erreur de chargement')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const selected = useMemo(() => loans.find((l) => l.id === pretId) || null, [loans, pretId])
  const estimatedLate = selected ? daysBetween(selected.due_date, returnDate) : 0

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!selected) return
    setBusy(true)
    setError('')
    setMessage('')
    setBanner(null)
    try {
      const res = await fetch('/api/retours', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pret_id: selected.id, book_condition: bookCondition, notes: notes.trim() || undefined, return_date: returnDate }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Échec du retour')
      const parts = [
        'Retour enregistré',
        json.days_late > 0 ? `${json.days_late} jour(s) de retard` : null,
        json.penalties > 0 ? `${json.penalties} pénalité(s) créée(s)` : null,
      ].filter(Boolean)
      setMessage(parts.join(' · ') + '.')
      setPretId('')
      setBookCondition('good')
      setNotes('')
      setReturnDate(todayValue())
      load()
    } catch (err) {
      setBanner({ type: 'error', text: err instanceof Error ? err.message : 'Erreur' })
    } finally {
      setBusy(false)
    }
  }

  const input = 'w-full rounded-lg border border-slate-200 bg-transparent px-3 py-2 text-sm outline-none focus:border-blue-500 dark:border-slate-700'

  return (
    <section className="flex-1 p-6 lg:p-8">
      <div className="mx-auto max-w-5xl">
        <Link href="/dashboard" className="mb-6 inline-flex items-center gap-2 text-sm text-slate-500 hover:text-blue-600 dark:text-slate-400">
          <ArrowLeft size={16} /> Retour au dashboard
        </Link>
        <div className="mb-6 flex items-start gap-3">
          <div className="rounded-xl bg-blue-100 p-3 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
            <Undo2 size={20} />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Retour d’exemplaire</h1>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Clôturez un prêt en cours : l’exemplaire redevient disponible et les pénalités de retard sont calculées automatiquement.</p>
          </div>
        </div>

        {loadError && (
          <div className="mb-4 flex items-center gap-2 rounded-lg bg-red-50 p-4 text-sm text-red-700 dark:bg-red-950/30 dark:text-red-300">
            <AlertCircle size={16} /> {loadError}
          </div>
        )}

        <form onSubmit={submit} className="space-y-5 rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
          <label className="block">
            <span className="mb-1 block text-xs font-medium">Prêt à clôturer *</span>
            <select required value={pretId} onChange={(e) => setPretId(e.target.value)} className={input}>
              <option value="">Sélectionner un prêt en cours…</option>
              {loans.map((loan) => (
                <option key={loan.id} value={loan.id}>
                  {loan.exemplaires?.documents?.title || 'Livre'} · {loan.exemplaires?.barcode || '—'} — {loan.members?.first_name || ''} {loan.members?.last_name || ''} (échéance {fmtDate(loan.due_date)})
                </option>
              ))}
            </select>
          </label>

          {selected && (
            <div className="grid gap-3 rounded-lg border border-slate-200 bg-slate-50 p-4 sm:grid-cols-2 dark:border-slate-700 dark:bg-slate-950/40">
              <div>
                <span className="text-xs font-medium text-slate-400">Document</span>
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{selected.exemplaires?.documents?.title || '—'}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {selected.exemplaires?.barcode || '—'} {selected.exemplaires?.cote_complete ? `· ${selected.exemplaires.cote_complete}` : ''}
                </p>
              </div>
              <div>
                <span className="text-xs font-medium text-slate-400">Membre</span>
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                  {selected.members?.first_name || ''} {selected.members?.last_name || ''}
                </p>
                <p className="truncate text-xs text-slate-500 dark:text-slate-400">{selected.members?.email || '—'}</p>
              </div>
              <div>
                <span className="text-xs font-medium text-slate-400">Échéance</span>
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{fmtDate(selected.due_date)}</p>
              </div>
              <div>
                <span className="text-xs font-medium text-slate-400">Retard estimé</span>
                <p className={`text-sm font-semibold ${estimatedLate > 0 ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                  {estimatedLate > 0 ? `${estimatedLate} jour(s)` : 'Aucun retard'}
                </p>
              </div>
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <label>
              <span className="mb-1 block text-xs font-medium">Date de retour *</span>
              <input required type="date" value={returnDate} onChange={(e) => setReturnDate(e.target.value)} className={input} />
            </label>
            <label>
              <span className="mb-1 block text-xs font-medium">État du livre *</span>
              <select value={bookCondition} onChange={(e) => setBookCondition(e.target.value)} className={input}>
                {CONDITIONS.map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </label>
          </div>

          <label className="block">
            <span className="mb-1 block text-xs font-medium">Notes</span>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} placeholder="Observations éventuelles…" className={`${input} resize-none`} />
          </label>

          {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950/30 dark:text-red-300">{error}</p>}
          {banner && (
            <p className={`rounded-lg p-3 text-sm ${banner.type === 'success' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300' : 'bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-300'}`}>
              {banner.text}
            </p>
          )}
          {message && <p className="flex items-center gap-2 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300"><Check size={16} /> {message}</p>}

          <button disabled={busy || !selected} className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700 disabled:opacity-60">
            {busy ? <Loader2 size={16} className="animate-spin" /> : <Undo2 size={16} />} Enregistrer le retour
          </button>
        </form>

        <section className="mt-8 overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between border-b border-slate-200 p-4 dark:border-slate-800">
            <div>
              <h2 className="font-semibold">Prêts en cours</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">Sélectionnez un prêt ci-dessus pour le retourner.</p>
            </div>
            <span className="text-xs font-medium text-slate-400">
              <BookOpen size={14} className="mr-1 inline" />
              {loans.length} actif(s)
            </span>
          </div>
          {loading ? (
            <div className="flex items-center justify-center gap-2 p-12 text-sm text-slate-500 dark:text-slate-400">
              <Loader2 size={18} className="animate-spin" /> Chargement des prêts…
            </div>
          ) : loans.length === 0 ? (
            <div className="p-10 text-center text-sm text-slate-500 dark:text-slate-400">Aucun prêt en cours. Tous les exemplaires sont disponibles.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-950">
                  <tr>
                    {['Document', 'Membre', 'Échéance', 'Statut'].map((h) => (
                      <th key={h} className="whitespace-nowrap px-5 py-3 font-semibold text-slate-500 dark:text-slate-400">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {loans.map((loan) => {
                    const late = daysBetween(loan.due_date, todayValue())
                    return (
                      <tr key={loan.id} className="border-b border-slate-100 last:border-0 dark:border-slate-800">
                        <td className="max-w-xs truncate px-5 py-3 text-slate-700 dark:text-slate-300">
                          <b className="block truncate">{loan.exemplaires?.documents?.title || '—'}</b>
                          <span className="text-xs text-slate-400">{loan.exemplaires?.barcode || '—'}</span>
                        </td>
                        <td className="whitespace-nowrap px-5 py-3 text-slate-700 dark:text-slate-300">
                          {loan.members?.first_name || ''} {loan.members?.last_name || ''}
                        </td>
                        <td className="whitespace-nowrap px-5 py-3 text-slate-600 dark:text-slate-300">{fmtDate(loan.due_date)}</td>
                        <td className="whitespace-nowrap px-5 py-3">
                          {late > 0 ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-semibold text-red-600 dark:bg-red-900/30 dark:text-red-300">
                              En retard ({late} j)
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-600 dark:bg-blue-900/30 dark:text-blue-300">
                              {loan.status === 'overdue' ? 'En retard' : 'En cours'}
                            </span>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </section>
  )
}