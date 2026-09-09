'use client'

import { FormEvent, useEffect, useMemo, useState } from 'react'
import { BookOpen, Check, Download, FileText, Loader2, Plus, Search, X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

type Resource = { id: string; title: string; description: string | null; url: string; type: string; category: string; access_level: string; downloadable: boolean; document_id: string | null }
type FormState = { title: string; description: string; url: string; type: string; category: string; access_level: string; downloadable: boolean }
const emptyForm: FormState = { title: '', description: '', url: '', type: 'pdf', category: 'article', access_level: 'all', downloadable: true }

export default function DigitalLibrary() {
  const [resources, setResources] = useState<Resource[]>([])
  const [selected, setSelected] = useState<Resource | null>(null)
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [role, setRole] = useState('student')
  const [showCreate, setShowCreate] = useState(false)
  const [form, setForm] = useState<FormState>(emptyForm)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    const supabase = createClient()
    async function load() {
      const [{ data, error: resourceError }, { data: user }] = await Promise.all([
        supabase.from('digital_resources').select('id, title, description, url, type, category, access_level, downloadable, document_id').order('title'),
        supabase.auth.getSession(),
      ])
      if (resourceError) setError(resourceError.message)
      else setResources((data || []) as Resource[])
      if (user.session?.user) {
        const { data: member } = await supabase.from('members').select('role').eq('id', user.session.user.id).maybeSingle()
        if (member?.role) setRole(member.role)
      }
      setLoading(false)
    }
    load()
  }, [])

  const categories = useMemo(() => [...new Set(resources.map((resource) => resource.category).filter(Boolean))].sort(), [resources])
  const filtered = resources.filter((resource) => {
    const value = query.trim().toLowerCase()
    return (!value || resource.title.toLowerCase().includes(value) || resource.description?.toLowerCase().includes(value)) && (!category || resource.category === category)
  })
  const update = (field: keyof FormState, value: string | boolean) => setForm((current) => ({ ...current, [field]: value }))

  async function createResource(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSaving(true); setError(''); setMessage('')
    const supabase = createClient()
    const { data: user } = await supabase.auth.getSession()
    if (!user.session?.user || !['admin', 'librarian'].includes(role)) {
      setError('Vous n’avez pas les droits pour ajouter une ressource.')
      setSaving(false)
      return
    }
    const { data, error: insertError } = await supabase.from('digital_resources').insert({ ...form, uploaded_by: user.session.user.id }).select('id, title, description, url, type, category, access_level, downloadable, document_id').single()
    if (insertError) setError(insertError.message)
    else if (data) {
      setResources((current) => [...current, data as Resource].sort((a, b) => a.title.localeCompare(b.title)))
      setForm(emptyForm); setShowCreate(false); setMessage('Ressource numérique ajoutée.')
    }
    setSaving(false)
  }

  const fileUrl = selected ? `/api/digital-resources/${selected.id}/file` : ''
  const downloadUrl = selected ? `${fileUrl}?download=1` : ''
  const inputClass = 'rounded-lg border border-slate-200 bg-transparent px-3 py-2 text-sm dark:border-slate-700'

  return (
    <section className="flex-1 p-6 lg:p-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div><p className="mb-1 flex items-center gap-2 text-sm font-medium text-emerald-600 dark:text-emerald-400"><span className="h-2 w-2 rounded-full bg-emerald-500" /> Bibliothèque numérique</p><h1 className="text-2xl font-bold">Ressources numériques</h1><p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Lisez les ressources directement dans Biblius.</p></div>
          {['admin', 'librarian'].includes(role) && <button onClick={() => setShowCreate((value) => !value)} className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"><Plus size={16} /> Ajouter une ressource</button>}
        </div>
        {message && <p className="mb-4 flex items-center gap-2 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300"><Check size={16} />{message}</p>}
        {showCreate && <form onSubmit={createResource} className="mb-6 grid gap-4 rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900 sm:grid-cols-2"><h2 className="sm:col-span-2 font-semibold">Ajouter une ressource numérique</h2><input required placeholder="Titre" value={form.title} onChange={(e) => update('title', e.target.value)} className={inputClass} /><input required type="url" placeholder="URL du fichier" value={form.url} onChange={(e) => update('url', e.target.value)} className={inputClass} /><textarea placeholder="Description" value={form.description} onChange={(e) => update('description', e.target.value)} className={`${inputClass} resize-none`} rows={2} /><select value={form.type} onChange={(e) => update('type', e.target.value)} className={inputClass}><option value="pdf">PDF</option><option value="video">Vidéo</option><option value="audio">Audio</option><option value="link">Lien</option></select><input placeholder="Catégorie" value={form.category} onChange={(e) => update('category', e.target.value)} className={inputClass} /><select value={form.access_level} onChange={(e) => update('access_level', e.target.value)} className={inputClass}><option value="all">Tous</option><option value="student">Étudiants</option><option value="staff">Personnel</option></select><label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.downloadable} onChange={(e) => update('downloadable', e.target.checked)} /> Téléchargeable</label><button disabled={saving} className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-60">{saving ? <Loader2 className="animate-spin" size={16} /> : <Check size={16} />} Enregistrer</button></form>}
        {loading ? <div className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white p-12 text-sm text-slate-500 dark:border-slate-800 dark:bg-slate-900"><Loader2 className="animate-spin" size={18} /> Chargement...</div> : error ? <p className="rounded-xl bg-red-50 p-6 text-sm text-red-700 dark:bg-red-950/30 dark:text-red-300">{error}</p> : <><div className="mb-5 grid gap-3 md:grid-cols-[1fr_240px]"><label className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 dark:border-slate-800 dark:bg-slate-900"><Search size={16} className="text-slate-400" /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Rechercher une ressource" className="w-full bg-transparent text-sm outline-none" /></label><select value={category} onChange={(e) => setCategory(e.target.value)} className={inputClass}><option value="">Toutes les catégories</option>{categories.map((item) => <option key={item}>{item}</option>)}</select></div><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{filtered.map((resource) => <article key={resource.id} className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900"><div className="mb-4 flex items-start justify-between"><div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400"><FileText size={19} /></div><span className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-semibold dark:bg-slate-800">{resource.type}</span></div><h2 className="font-semibold">{resource.title}</h2><p className="mt-2 min-h-10 text-sm text-slate-500 dark:text-slate-400">{resource.description || 'Ressource numérique de la bibliothèque.'}</p><div className="mt-4 flex items-center justify-between gap-2"><span className="text-xs text-slate-400">{resource.category}</span><button onClick={() => setSelected(resource)} className="inline-flex items-center gap-1 rounded-lg bg-blue-600 px-3 py-2 text-xs font-medium text-white hover:bg-blue-700"><BookOpen size={14} /> Lire</button></div></article>)}</div></>}
      </div>
      {selected && <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/90 p-4"><section className="flex h-[90vh] w-full max-w-6xl flex-col overflow-hidden rounded-xl bg-white shadow-2xl dark:bg-slate-900"><header className="flex items-center justify-between gap-3 border-b border-slate-200 px-4 py-3 dark:border-slate-800"><div className="min-w-0"><h2 className="truncate font-semibold">{selected.title}</h2><p className="text-xs text-slate-500">Lecture locale sécurisée · {selected.type}</p></div><div className="flex items-center gap-2">{selected.downloadable && <a href={downloadUrl} className="inline-flex items-center gap-1 rounded-lg bg-blue-600 px-3 py-2 text-xs font-medium text-white"><Download size={14} /> Télécharger</a>}<button onClick={() => setSelected(null)} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800" aria-label="Fermer"><X size={18} /></button></div></header><div className="min-h-0 flex-1 bg-slate-100 dark:bg-slate-950"><iframe src={fileUrl} title={selected.title} className="h-full w-full border-0" /></div></section></div>}
    </section>
  )
}
