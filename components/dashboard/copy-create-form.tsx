'use client'

import { FormEvent, useEffect, useState } from 'react'
import { Check, Loader2, RefreshCw } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

type Document = { id: string; title: string }

function makeBarcode() { return `BC-${Date.now().toString(36).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}` }

export default function CopyCreateForm() {
  const [documents, setDocuments] = useState<Document[]>([])
  const [documentId, setDocumentId] = useState('')
  const [barcode, setBarcode] = useState(makeBarcode())
  const [inventoryCode, setInventoryCode] = useState('')
  const [cote, setCote] = useState('')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  useEffect(() => { createClient().from('documents').select('id, title').order('title').then(({ data }) => setDocuments((data || []) as Document[])) }, [])

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError(''); setMessage('')
    const supabase = createClient()
    const { data: user } = await supabase.auth.getSession()
    if (!user.session?.user) { setError('Vous devez être connecté.'); setBusy(false); return }
    const { data: member } = await supabase.from('members').select('role').eq('id', user.session.user.id).maybeSingle()
    if (!member?.role || !['admin', 'librarian'].includes(member.role)) { setError('Seuls les administrateurs et bibliothécaires peuvent ajouter un exemplaire.'); setBusy(false); return }
    const { error: insertError } = await supabase.from('exemplaires').insert({ document_id: documentId, barcode: barcode.trim(), inventory_code: inventoryCode.trim() || null, cote_complete: cote.trim() || null, status: 'available' })
    if (insertError) setError(insertError.message); else { setMessage('Exemplaire ajouté et lié au livre.'); setBarcode(makeBarcode()); setInventoryCode(''); setCote('') }
    setBusy(false)
  }

  const input = 'w-full rounded-lg border border-slate-200 bg-transparent px-3 py-2 text-sm dark:border-slate-700'
  return <section className="flex-1 p-6 lg:p-8"><div className="mx-auto max-w-3xl"><h1 className="mb-2 text-2xl font-bold">Ajouter un exemplaire</h1><p className="mb-6 text-sm text-slate-500 dark:text-slate-400">Reliez un exemplaire physique à un livre existant.</p><form onSubmit={submit} className="space-y-5 rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900"><label className="block"><span className="mb-1 block text-xs font-medium">Livre *</span><select required value={documentId} onChange={(e) => setDocumentId(e.target.value)} className={input}><option value="">Sélectionner un livre</option>{documents.map((document) => <option key={document.id} value={document.id}>{document.title}</option>)}</select></label><label className="block"><span className="mb-1 block text-xs font-medium">Code-barres *</span><div className="flex gap-2"><input required value={barcode} onChange={(e) => setBarcode(e.target.value)} className={input} /><button type="button" onClick={() => setBarcode(makeBarcode())} className="rounded-lg border border-slate-200 px-3 dark:border-slate-700"><RefreshCw size={16} /></button></div></label><label className="block"><span className="mb-1 block text-xs font-medium">Code inventaire</span><input value={inventoryCode} onChange={(e) => setInventoryCode(e.target.value)} className={input} /></label><label className="block"><span className="mb-1 block text-xs font-medium">Cote complète</span><input value={cote} onChange={(e) => setCote(e.target.value)} className={input} /></label>{error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950/30 dark:text-red-300">{error}</p>}{message && <p className="flex items-center gap-2 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300"><Check size={16} />{message}</p>}<button disabled={busy} className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-60">{busy ? <Loader2 className="animate-spin" size={16} /> : <Check size={16} />} Enregistrer l’exemplaire</button></form></div></section>
}
