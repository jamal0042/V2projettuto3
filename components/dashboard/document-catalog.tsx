'use client'

import { useEffect, useMemo, useState } from 'react'
import { BookOpen, Database, Loader2, Search, UserRound } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

type DocumentRow = {
  id: string
  title: string
  type: string
  year: number | null
  publisher: string | null
  dewey_code: string | null
  author: string
}

export default function DocumentCatalog() {
  const [documents, setDocuments] = useState<DocumentRow[]>([])
  const [query, setQuery] = useState('')
  const [author, setAuthor] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const supabase = createClient()
    supabase.from('documents').select('id, title, type, year, publisher, dewey_code, document_auteurs(auteurs(name))').order('title').then(({ data, error: queryError }) => {
      if (queryError) setError(queryError.message)
      else setDocuments((data || []).map((row: any) => ({ ...row, author: row.document_auteurs?.map((item: any) => item.auteurs?.name).filter(Boolean).join(', ') || 'Auteur non renseigné' })))
      setLoading(false)
    })
  }, [])

  const authors = useMemo(() => [...new Set(documents.map((document) => document.author))].sort(), [documents])
  const filtered = documents.filter((document) => {
    const search = query.trim().toLowerCase()
    return (!search || document.title.toLowerCase().includes(search)) && (!author || document.author === author)
  })

  return <section className="flex-1 p-6 lg:p-8"><div className="mx-auto max-w-7xl"><div className="mb-6"><p className="mb-1 flex items-center gap-2 text-sm font-medium text-emerald-600 dark:text-emerald-400"><span className="h-2 w-2 rounded-full bg-emerald-500" /> Données en temps réel</p><h1 className="text-2xl font-bold">Documents</h1><p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Recherchez un livre par son titre ou son auteur.</p></div><div className="mb-5 grid gap-3 md:grid-cols-[1fr_260px]"><label className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 dark:border-slate-800 dark:bg-slate-900"><Search size={16} className="text-slate-400" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Filtrer selon le titre du livre" className="w-full bg-transparent text-sm outline-none" /></label><label className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 dark:border-slate-800 dark:bg-slate-900"><UserRound size={16} className="text-slate-400" /><select value={author} onChange={(event) => setAuthor(event.target.value)} className="w-full bg-transparent text-sm outline-none"><option value="">Tous les auteurs</option>{authors.map((item) => <option key={item}>{item}</option>)}</select></label></div><section className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">{loading ? <div className="flex items-center justify-center gap-2 p-12 text-sm text-slate-500"><Loader2 className="animate-spin" size={18} /> Chargement...</div> : error ? <p className="p-8 text-sm text-red-600">{error}</p> : filtered.length === 0 ? <div className="p-12 text-center text-sm text-slate-500 dark:text-slate-400">Aucun livre ne correspond à votre recherche.</div> : <div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead className="border-b border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-950"><tr>{['Titre', 'Auteur', 'Type', 'Dewey', 'Année', 'Éditeur'].map((label) => <th key={label} className="whitespace-nowrap px-5 py-3 font-semibold text-slate-500 dark:text-slate-400">{label}</th>)}</tr></thead><tbody>{filtered.map((document) => <tr key={document.id} className="border-b border-slate-100 last:border-0 dark:border-slate-800"><td className="px-5 py-3 font-medium text-slate-900 dark:text-slate-100"><BookOpen size={14} className="mr-2 inline text-blue-500" />{document.title}</td><td className="px-5 py-3 text-slate-700 dark:text-slate-300">{document.author}</td><td className="px-5 py-3 text-slate-500">{document.type}</td><td className="px-5 py-3"><span className="inline-flex items-center gap-1 rounded-md bg-amber-50 px-2 py-1 text-xs font-semibold text-amber-700 dark:bg-amber-900/30 dark:text-amber-300"><Database size={12} />{document.dewey_code || '—'}</span></td><td className="px-5 py-3 text-slate-500">{document.year || '—'}</td><td className="px-5 py-3 text-slate-500">{document.publisher || '—'}</td></tr>)}</tbody></table></div>}</section></div></section>
}
