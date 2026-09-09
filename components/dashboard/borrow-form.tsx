'use client'

import { FormEvent, useEffect, useState } from 'react'
import { ArrowRight, Check, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

type Copy = { id: string; barcode: string; document: { title: string } | null }
type Member = { id: string; first_name: string; last_name: string; email: string }

export default function BorrowForm() {
  const [copies, setCopies] = useState<Copy[]>([])
  const [members, setMembers] = useState<Member[]>([])
  const [copyId, setCopyId] = useState('')
  const [memberId, setMemberId] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    const supabase = createClient()
    Promise.all([
      supabase.from('exemplaires').select('id, barcode, documents(title)').eq('status', 'available').order('barcode'),
      supabase.from('members').select('id, first_name, last_name, email').eq('status', 'active').order('last_name'),
    ]).then(([copiesResult, membersResult]) => {
      setCopies((copiesResult.data || []).map((item: any) => ({ ...item, document: item.documents })))
      setMembers((membersResult.data || []) as Member[])
    })
  }, [])

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setBusy(true); setError(''); setMessage('')
    const supabase = createClient()
    const { error: loanError } = await supabase.from('prets').insert({ member_id: memberId, exemplaire_id: copyId, due_date: dueDate, status: 'active' })
    if (loanError) setError(loanError.message)
    else {
      await supabase.from('exemplaires').update({ status: 'loaned' }).eq('id', copyId)
      setMessage('Emprunt enregistré. L’exemplaire est maintenant marqué comme prêté.')
      setCopies((current) => current.filter((copy) => copy.id !== copyId)); setCopyId(''); setMemberId(''); setDueDate('')
    }
    setBusy(false)
  }

  return <section className="flex-1 p-6 lg:p-8"><div className="mx-auto max-w-3xl"><div className="mb-6"><h1 className="text-2xl font-bold">Nouvel emprunt</h1><p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Un emprunt porte toujours sur un exemplaire disponible.</p></div><form onSubmit={submit} className="space-y-5 rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900"><label className="block"><span className="mb-1 block text-xs font-medium">Livre et exemplaire</span><select required value={copyId} onChange={(event) => setCopyId(event.target.value)} className="w-full rounded-lg border border-slate-200 bg-transparent px-3 py-2 text-sm dark:border-slate-700"><option value="">Sélectionner un exemplaire disponible</option>{copies.map((copy) => <option key={copy.id} value={copy.id}>{copy.document?.title || 'Livre'} · {copy.barcode}</option>)}</select></label><label className="block"><span className="mb-1 block text-xs font-medium">Membre</span><select required value={memberId} onChange={(event) => setMemberId(event.target.value)} className="w-full rounded-lg border border-slate-200 bg-transparent px-3 py-2 text-sm dark:border-slate-700"><option value="">Sélectionner un membre</option>{members.map((member) => <option key={member.id} value={member.id}>{member.first_name} {member.last_name} · {member.email}</option>)}</select></label><label className="block"><span className="mb-1 block text-xs font-medium">Date de retour prévue</span><input required type="date" value={dueDate} onChange={(event) => setDueDate(event.target.value)} className="w-full rounded-lg border border-slate-200 bg-transparent px-3 py-2 text-sm dark:border-slate-700" /></label>{error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950/30 dark:text-red-300">{error}</p>}{message && <p className="flex items-center gap-2 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300"><Check size={16} />{message}</p>}<button disabled={busy} className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-60">{busy ? <Loader2 className="animate-spin" size={16} /> : <ArrowRight size={16} />} Enregistrer l’emprunt</button></form></div></section>
}
