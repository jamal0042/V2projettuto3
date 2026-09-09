'use client'

import { FormEvent, useState } from 'react'
import { Bot, Loader2, Send, Sparkles, UserRound } from 'lucide-react'

type Message = { role: 'user' | 'assistant'; text: string }

export default function AiChat() {
  const [messages, setMessages] = useState<Message[]>([{ role: 'assistant', text: 'Bonjour, je suis Biblius Intelligence. Que souhaitez-vous explorer dans votre bibliothèque ?' }])
  const [value, setValue] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function send(event: FormEvent) {
    event.preventDefault()
    const message = value.trim()
    if (!message || busy) return
    setValue(''); setError(''); setMessages((current) => [...current, { role: 'user', text: message }]); setBusy(true)
    let response: Response
    try {
      response = await fetch('/api/agent-ia', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message }) })
    } catch {
      setError('Connexion au serveur impossible. Réessayez dans un instant.')
      setBusy(false)
      return
    }
    const data = await response.json().catch(() => ({}))
    if (!response.ok) setError(data.error || 'Impossible de contacter l’assistant.')
    else setMessages((current) => [...current, { role: 'assistant', text: data.answer }])
    setBusy(false)
  }

  return <section className="flex-1 p-6 lg:p-8"><div className="mx-auto flex max-w-4xl flex-col" style={{ minHeight: 'calc(100vh - 130px)' }}><div className="mb-6 flex items-start gap-3"><div className="rounded-xl bg-violet-100 p-3 text-violet-600 dark:bg-violet-900/30 dark:text-violet-300"><Sparkles size={21} /></div><div><h1 className="text-2xl font-bold">Agent IA Biblius</h1><p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Votre assistant intelligent pour la gestion de bibliothèque.</p></div></div><div className="flex flex-1 flex-col overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900"><div className="flex-1 space-y-4 overflow-y-auto p-5">{messages.map((message, index) => <div key={`${message.role}-${index}`} className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : ''}`}><div className={`flex max-w-[80%] gap-2 rounded-xl px-4 py-3 text-sm ${message.role === 'user' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200'}`}>{message.role === 'assistant' ? <Bot size={16} className="mt-0.5 shrink-0" /> : <UserRound size={16} className="mt-0.5 shrink-0" />}<span className="whitespace-pre-wrap">{message.text}</span></div></div>)}{busy && <div className="flex items-center gap-2 text-sm text-slate-500"><Loader2 className="animate-spin" size={16} /> Biblius réfléchit...</div>}</div><form onSubmit={send} className="flex gap-2 border-t border-slate-200 p-4 dark:border-slate-800"><input value={value} onChange={(event) => setValue(event.target.value)} placeholder="Posez une question à Biblius..." className="min-w-0 flex-1 rounded-lg border border-slate-200 bg-transparent px-3 py-2 text-sm outline-none focus:border-blue-500 dark:border-slate-700" /><button disabled={busy || !value.trim()} className="rounded-lg bg-blue-600 px-4 text-white disabled:opacity-50" aria-label="Envoyer"><Send size={16} /></button></form></div>{error && <p className="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950/30 dark:text-red-300">{error}</p>}</div></section>
}
