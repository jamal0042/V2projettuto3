'use client'

import { FormEvent, useEffect, useMemo, useState } from 'react'
import { BookOpen, Check, Clock, Database, Loader2, Pencil, Search, Trash2, UserRound, X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

type Author = { id: string; name: string }
type Dewey = { code: string; libelle: string }

type DocumentRow = {
  id: string
  title: string
  type: string
  year: number | null
  publisher: string | null
  isbn: string | null
  description: string | null
  dewey_code: string | null
  author: string
  authorIds: string[]
}

type EditState = {
  id: string
  title: string
  type: string
  year: string
  publisher: string
  isbn: string
  description: string
  deweyCode: string
  authorIds: string[]
} | null

type LoanRow = {
  id: string
  status: string
  loan_date: string | null
  due_date: string | null
  copy: { barcode: string; document: { id: string; title: string; type: string; year: number | null } | null } | null
}

export default function DocumentCatalog() {
  const [documents, setDocuments] = useState<DocumentRow[]>([])
  const [authors, setAuthors] = useState<Author[]>([])
  const [deweyClasses, setDeweyClasses] = useState<Dewey[]>([])
  const [query, setQuery] = useState('')
  const [author, setAuthor] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [allowed, setAllowed] = useState(false)
  const [role, setRole] = useState<string | null>(null)
  const [roleChecked, setRoleChecked] = useState(false)
  const [editing, setEditing] = useState<EditState>(null)
  const [deleting, setDeleting] = useState<DocumentRow | null>(null)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [loans, setLoans] = useState<LoanRow[]>([])
  const [loansLoading, setLoansLoading] = useState(false)

  async function loadDocuments(supabase: ReturnType<typeof createClient>) {
    const { data, error: queryError } = await supabase
      .from('documents')
      .select('id, title, type, year, publisher, isbn, description, dewey_code, document_auteurs(author_id, auteurs(name))')
      .order('title')
    if (queryError) setError(queryError.message)
    else
      setDocuments(
        (data || []).map((row: any) => ({
          ...row,
          author: row.document_auteurs?.map((item: any) => item.auteurs?.name).filter(Boolean).join(', ') || 'Auteur non renseigné',
          authorIds: row.document_auteurs?.map((item: any) => item.author_id).filter(Boolean) || [],
        })),
      )
  }

  async function loadLoans(supabase: ReturnType<typeof createClient>, memberId: string) {
    setLoansLoading(true)
    const { data, error: queryError } = await supabase
      .from('prets')
      .select('id, status, loan_date, due_date, exemplaires(barcode, documents(id, title, type, year))')
      .eq('member_id', memberId)
      .order('loan_date', { ascending: false })
    if (queryError) setError(queryError.message)
    else setLoans((data || []).map((row: any) => ({ ...row, copy: row.exemplaires })))
    setLoansLoading(false)
  }

  useEffect(() => {
    const supabase = createClient()
    Promise.all([supabase.from('auteurs').select('id, name').order('name'), supabase.from('dewey_classes').select('code, libelle').eq('status', 'active').order('code')]).then(([authorResult, deweyResult]) => {
      setAuthors((authorResult.data || []) as Author[])
      setDeweyClasses((deweyResult.data || []) as Dewey[])
    })
    supabase.auth.getSession().then(async ({ data }) => {
      if (!data.session?.user) return
      const { data: member } = await supabase.from('members').select('role').eq('id', data.session.user.id).maybeSingle()
      if (member?.role) {
        setRole(member.role)
        setAllowed(['admin', 'librarian'].includes(member.role))
        if (member.role === 'student' || member.role === 'external') {
          await loadLoans(supabase, data.session!.user.id)
        }
      }
      setRoleChecked(true)
    })
    loadDocuments(supabase).finally(() => setLoading(false))
  }, [])

  const authorsList = useMemo(() => [...new Set(documents.map((document) => document.author))].sort(), [documents])
  const filtered = documents.filter((document) => {
    const search = query.trim().toLowerCase()
    return (!search || document.title.toLowerCase().includes(search)) && (!author || document.author === author)
  })

  function startEdit(document: DocumentRow) {
    setEditing({
      id: document.id,
      title: document.title,
      type: document.type,
      year: document.year != null ? String(document.year) : '',
      publisher: document.publisher || '',
      isbn: document.isbn || '',
      description: document.description || '',
      deweyCode: document.dewey_code || '',
      authorIds: document.authorIds,
    })
  }

  function toggleEditAuthor(id: string) {
    if (!editing) return
    setEditing((current) => (current ? { ...current, authorIds: current.authorIds.includes(id) ? current.authorIds.filter((a) => a !== id) : [...current.authorIds, id] } : current))
  }

  async function saveEdit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!editing) return
    setBusy(true)
    setError('')
    setMessage('')
    const supabase = createClient()
    if (editing.authorIds.length === 0) {
      setError('Veuillez sélectionner au moins un auteur.')
      setBusy(false)
      return
    }
    const selectedDewey = deweyClasses.find((item) => item.code === editing.deweyCode)
    const { error: updateError } = await supabase
      .from('documents')
      .update({
        title: editing.title.trim(),
        type: editing.type,
        year: editing.year ? Number(editing.year) : null,
        publisher: editing.publisher.trim() || null,
        isbn: editing.isbn.trim() || null,
        description: editing.description.trim() || null,
        dewey_code: editing.deweyCode || null,
        cote_dewey: selectedDewey ? `${selectedDewey.code} ${selectedDewey.libelle}` : null,
      })
      .eq('id', editing.id)
    if (updateError) {
      setError(updateError.message)
      setBusy(false)
      return
    }
    const { error: clearError } = await supabase.from('document_auteurs').delete().eq('document_id', editing.id)
    if (clearError) {
      setError(clearError.message)
      setBusy(false)
      return
    }
    const authorRows = editing.authorIds.map((id, index) => ({ document_id: editing.id, author_id: id, role: index === 0 ? 'principal' : 'coauteur', author_order: index + 1 }))
    const { error: authorError } = await supabase.from('document_auteurs').insert(authorRows)
    if (authorError) {
      setError(authorError.message)
      setBusy(false)
      return
    }
    setMessage('Document et auteurs mis à jour.')
    setEditing(null)
    await loadDocuments(supabase)
    setBusy(false)
  }

  async function confirmDelete() {
    if (!deleting) return
    setBusy(true)
    setError('')
    setMessage('')
    const supabase = createClient()
    try {
      const { data: copies } = await supabase.from('exemplaires').select('id').eq('document_id', deleting.id)
      const copyIds = (copies || []).map((copy: any) => copy.id)
      if (copyIds.length > 0) {
        const { data: loans } = await supabase.from('prets').select('id').in('exemplaire_id', copyIds)
        const loanIds = (loans || []).map((loan: any) => loan.id)
        if (loanIds.length > 0) {
          await supabase.from('retours').delete().in('pret_id', loanIds)
          await supabase.from('notifications').delete().in('pret_id', loanIds)
          await supabase.from('prets').delete().in('id', loanIds)
        }
        await supabase.from('exemplaires').delete().in('id', copyIds)
      }
      await supabase.from('reservations').delete().eq('document_id', deleting.id)
      await supabase.from('document_auteurs').delete().eq('document_id', deleting.id)
      await supabase.from('digital_resources').delete().eq('document_id', deleting.id)
      const { error: deleteError } = await supabase.from('documents').delete().eq('id', deleting.id)
      if (deleteError) {
        setError(deleteError.message)
        return
      }
      setMessage('Le document et ses exemplaires ont été supprimés.')
      setDeleting(null)
      await loadDocuments(supabase)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'La suppression a échoué.')
    } finally {
      setBusy(false)
    }
  }

  const input = 'w-full rounded-lg border border-slate-200 bg-transparent px-3 py-2 text-sm outline-none focus:border-blue-500 dark:border-slate-700'

  return (
    <section className="flex-1 p-6 lg:p-8">
      <div className="mx-auto max-w-7xl">
        {role === 'student' || role === 'external' ? (
          <>
            <div className="mb-6">
              <p className="mb-1 flex items-center gap-2 text-sm font-medium text-emerald-600 dark:text-emerald-400"><span className="h-2 w-2 rounded-full bg-emerald-500" /> Mes emprunts</p>
              <h1 className="text-2xl font-bold">Mes emprunts</h1>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Consultez les documents que vous avez empruntés à la bibliothèque.</p>
            </div>
            <section className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
              {loansLoading ? <div className="flex items-center justify-center gap-2 p-12 text-sm text-slate-500"><Loader2 className="animate-spin" size={18} /> Chargement...</div>
                : error ? <p className="p-8 text-sm text-red-600">{error}</p>
                : loans.length === 0 ? <div className="p-12 text-center text-sm text-slate-500 dark:text-slate-400">Vous n&apos;avez aucun emprunt en cours ou passé.</div>
                : <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead className="border-b border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-950">
                        <tr>
                          {['Document', 'Type', 'Exemplaire', 'Date d’emprunt', 'Retour prévu', 'Statut'].map((label) => <th key={label} className="whitespace-nowrap px-5 py-3 font-semibold text-slate-500 dark:text-slate-400">{label}</th>)}
                        </tr>
                      </thead>
                      <tbody>
                        {loans.map((loan) => {
                          const doc = loan.copy?.document
                          const isOverdue = loan.status === 'active' && loan.due_date && new Date(loan.due_date) < new Date()
                          const statusLabel = isOverdue ? 'En retard' : loan.status === 'active' ? 'En cours' : loan.status === 'returned' ? 'Rendu' : loan.status
                          return <tr key={loan.id} className="border-b border-slate-100 last:border-0 dark:border-slate-800">
                            <td className="px-5 py-3 font-medium text-slate-900 dark:text-slate-100"><BookOpen size={14} className="mr-2 inline text-blue-500" />{doc?.title || 'Document supprimé'}</td>
                            <td className="px-5 py-3 text-slate-500">{doc?.type || '—'}</td>
                            <td className="px-5 py-3 text-slate-500">{loan.copy?.barcode || '—'}</td>
                            <td className="px-5 py-3 text-slate-500">{loan.loan_date ? new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(loan.loan_date)) : '—'}</td>
                            <td className="px-5 py-3 text-slate-500">{loan.due_date ? new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(loan.due_date)) : '—'}</td>
                            <td className="whitespace-nowrap px-5 py-3">
                              <span className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-semibold ${isOverdue ? 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300' : loan.status === 'active' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'}`}>{isOverdue || loan.status !== 'returned' ? <Clock size={12} /> : <Check size={12} />}{statusLabel}</span>
                            </td>
                          </tr>
                        })}
                      </tbody>
                    </table>
                  </div>}
            </section>
          </>
        ) : (
        <>
        <div className="mb-6">
          <p className="mb-1 flex items-center gap-2 text-sm font-medium text-emerald-600 dark:text-emerald-400"><span className="h-2 w-2 rounded-full bg-emerald-500" /> Données en temps réel</p>
          <h1 className="text-2xl font-bold">Documents</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Recherchez un livre par son titre ou son auteur.</p>
        </div>
        {message && <p className="mb-4 flex items-center gap-2 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300"><Check size={16} />{message}</p>}
        <div className="mb-5 grid gap-3 md:grid-cols-[1fr_260px]">
          <label className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 dark:border-slate-800 dark:bg-slate-900">
            <Search size={16} className="text-slate-400" />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Filtrer selon le titre du livre" className="w-full bg-transparent text-sm outline-none" />
          </label>
          <label className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 dark:border-slate-800 dark:bg-slate-900">
            <UserRound size={16} className="text-slate-400" />
            <select value={author} onChange={(event) => setAuthor(event.target.value)} className="w-full bg-transparent text-sm outline-none">
              <option value="">Tous les auteurs</option>
              {authorsList.map((item) => <option key={item}>{item}</option>)}
            </select>
          </label>
        </div>
        <section className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
          {loading ? <div className="flex items-center justify-center gap-2 p-12 text-sm text-slate-500"><Loader2 className="animate-spin" size={18} /> Chargement...</div>
            : error ? <p className="p-8 text-sm text-red-600">{error}</p>
            : filtered.length === 0 ? <div className="p-12 text-center text-sm text-slate-500 dark:text-slate-400">Aucun livre ne correspond à votre recherche.</div>
            : <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-950">
                    <tr>
                      {['Titre', 'Auteur', 'Type', 'Dewey', 'Année', 'Éditeur', 'Actions'].map((label) => <th key={label} className="whitespace-nowrap px-5 py-3 font-semibold text-slate-500 dark:text-slate-400">{label}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((document) => <tr key={document.id} className="border-b border-slate-100 last:border-0 dark:border-slate-800">
                      <td className="px-5 py-3 font-medium text-slate-900 dark:text-slate-100"><BookOpen size={14} className="mr-2 inline text-blue-500" />{document.title}</td>
                      <td className="px-5 py-3 text-slate-700 dark:text-slate-300">{document.author}</td>
                      <td className="px-5 py-3 text-slate-500">{document.type}</td>
                      <td className="px-5 py-3"><span className="inline-flex items-center gap-1 rounded-md bg-amber-50 px-2 py-1 text-xs font-semibold text-amber-700 dark:bg-amber-900/30 dark:text-amber-300"><Database size={12} />{document.dewey_code || '—'}</span></td>
                      <td className="px-5 py-3 text-slate-500">{document.year || '—'}</td>
                      <td className="px-5 py-3 text-slate-500">{document.publisher || '—'}</td>
                      <td className="whitespace-nowrap px-5 py-3">
                        {allowed && roleChecked ? <div className="flex items-center gap-1">
                          <button onClick={() => startEdit(document)} className="inline-flex items-center gap-1 rounded-md bg-amber-50 px-2.5 py-1.5 text-xs font-medium text-amber-700 transition hover:bg-amber-100 dark:bg-amber-900/30 dark:text-amber-300 dark:hover:bg-amber-900/50"><Pencil size={13} /> Modifier</button>
                          <button onClick={() => setDeleting(document)} className="inline-flex items-center gap-1 rounded-md bg-red-50 px-2.5 py-1.5 text-xs font-medium text-red-700 transition hover:bg-red-100 dark:bg-red-900/30 dark:text-red-300 dark:hover:bg-red-900/50"><Trash2 size={13} /> Supprimer</button>
                        </div> : <span className="text-xs text-slate-400">—</span>}
                      </td>
                    </tr>)}
                  </tbody>
                </table>
              </div>}
        </section>
      </>
      )}
      </div>

      {editing && <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/70 p-4">
        <form onSubmit={saveEdit} className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
          <div className="mb-5 flex items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold">Modifier le document</h2>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Mettez à jour le livre et ses auteurs.</p>
            </div>
            <button type="button" onClick={() => setEditing(null)} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800" aria-label="Fermer"><X size={18} /></button>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="sm:col-span-2"><span className="mb-1 block text-xs font-medium">Titre du livre *</span><input required value={editing.title} onChange={(e) => setEditing({ ...editing, title: e.target.value })} className={input} /></label>
            <label><span className="mb-1 block text-xs font-medium">Type</span><select value={editing.type} onChange={(e) => setEditing({ ...editing, type: e.target.value })} className={input}><option value="book">Livre</option><option value="thesis">Thèse</option><option value="memoire">Mémoire</option><option value="journal">Journal</option><option value="article">Article</option></select></label>
            <label><span className="mb-1 block text-xs font-medium">Classification Dewey</span><select value={editing.deweyCode} onChange={(e) => setEditing({ ...editing, deweyCode: e.target.value })} className={input}><option value="">Sélectionner le code Dewey</option>{deweyClasses.map((item) => <option key={item.code} value={item.code}>{item.code} · {item.libelle}</option>)}</select></label>
            <label><span className="mb-1 block text-xs font-medium">ISBN</span><input value={editing.isbn} onChange={(e) => setEditing({ ...editing, isbn: e.target.value })} className={input} /></label>
            <label><span className="mb-1 block text-xs font-medium">Éditeur</span><input value={editing.publisher} onChange={(e) => setEditing({ ...editing, publisher: e.target.value })} className={input} /></label>
            <label><span className="mb-1 block text-xs font-medium">Année</span><input type="number" value={editing.year} onChange={(e) => setEditing({ ...editing, year: e.target.value })} className={input} /></label>
            <label className="sm:col-span-2"><span className="mb-1 block text-xs font-medium">Description</span><textarea rows={3} value={editing.description} onChange={(e) => setEditing({ ...editing, description: e.target.value })} className={`${input} resize-none`} /></label>
            <div className="sm:col-span-2">
              <span className="mb-1 block text-xs font-medium">Auteurs * (un ou plusieurs)</span>
              <div className="flex max-h-40 flex-wrap gap-2 overflow-y-auto rounded-lg border border-slate-200 p-3 dark:border-slate-700">
                {authors.map((item) => {
                  const selected = editing.authorIds.includes(item.id)
                  return <button key={item.id} type="button" onClick={() => toggleEditAuthor(item.id)} className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs font-medium transition ${selected ? 'border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' : 'border-slate-200 text-slate-600 hover:border-blue-300 dark:border-slate-700 dark:text-slate-300'}`}>{selected && <Check size={12} />}{item.name}</button>
                })}
              </div>
            </div>
          </div>
          {error && <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950/30 dark:text-red-300">{error}</p>}
          <div className="mt-6 flex justify-end gap-3">
            <button type="button" onClick={() => setEditing(null)} disabled={busy} className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 disabled:opacity-60 dark:border-slate-700 dark:text-slate-300">Annuler</button>
            <button disabled={busy} className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-60">{busy ? <Loader2 className="animate-spin" size={16} /> : <Check size={16} />} Enregistrer</button>
          </div>
        </form>
      </div>}

      {deleting && <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/70 p-4">
        <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
          <div className="mb-4 flex items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-red-600 dark:text-red-400">Supprimer le document</h2>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Supprimer définitivement « {deleting.title} » ainsi que ses exemplaires et relations ? Cette action est irréversible.</p>
            </div>
            <button onClick={() => setDeleting(null)} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800" aria-label="Fermer"><X size={18} /></button>
          </div>
          {error && <p className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950/30 dark:text-red-300">{error}</p>}
          <div className="flex justify-end gap-3">
            <button onClick={() => setDeleting(null)} disabled={busy} className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 disabled:opacity-60 dark:border-slate-700 dark:text-slate-300">Annuler</button>
            <button onClick={confirmDelete} disabled={busy} className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-60">{busy ? <Loader2 className="animate-spin" size={16} /> : <Trash2 size={16} />} Supprimer</button>
          </div>
        </div>
      </div>}
    </section>
  )
}