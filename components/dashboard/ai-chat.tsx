'use client'

import { FormEvent, useState } from 'react'
import { Bot, FileText, Loader2, Send, Sparkles, UserRound } from 'lucide-react'
import { useRouter } from 'next/navigation'

type Message = { role: 'user' | 'assistant'; text: string }

type Suggestion = { label: string; id: string }

const SUGGESTION_RE = /\[OUVRIR\]((?:[^\[]|[^\]])+?)\[ID\]([a-f0-9-]+)\[\/ID\]\[\/OUVRIR\]/gi

function parseSuggestions(text: string): { clean: string; suggestions: Suggestion[] } {
  const suggestions: Suggestion[] = []
  let clean = text.replace(SUGGESTION_RE, (_match, label: string, id: string) => {
    suggestions.push({ label: label.trim(), id: id.trim() })
    return ''
  })
  clean = clean.replace(/\n{3,}/g, '\n\n').trim()
  return { clean, suggestions }
}

function ResourceButton({ suggestion, onOpen }: { suggestion: Suggestion; onOpen: (id: string) => void }) {
  return (
    <button
      onClick={() => onOpen(suggestion.id)}
      className="mt-2 flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-left text-xs font-medium text-blue-700 transition hover:bg-blue-100 dark:border-blue-800 dark:bg-blue-950/40 dark:text-blue-300 dark:hover:bg-blue-900/40"
    >
      <FileText size={14} className="shrink-0" />
      <span className="min-w-0 flex-1 truncate">{suggestion.label}</span>
      <span className="shrink-0 rounded-full bg-blue-600 px-2 py-0.5 text-[10px] font-semibold text-white">Consulter</span>
    </button>
  )
}

export default function AiChat() {
  const router = useRouter()
  const [messages, setMessages] = useState<Message[]>([{ role: 'assistant', text: 'Bonjour, je suis Biblius Intelligence. Que souhaitez-vous explorer dans votre bibliothèque ?' }])
  const [value, setValue] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  function openResource(id: string) {
    router.push(`/dashboard/ressources-numeriques?resource=${id}`)
  }

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
    if (!response.ok) setError(data.error || 'Impossible de contacter l\u2019assistant.')
    else setMessages((current) => [...current, { role: 'assistant', text: data.answer }])
    setBusy(false)
  }

  return (
    <section className="flex-1 p-6 lg:p-8">
      <div className="mx-auto flex max-w-4xl flex-col" style={{ minHeight: 'calc(100vh - 130px)' }}>
        <div className="mb-6 flex items-start gap-3">
          <div className="rounded-xl bg-violet-100 p-3 text-violet-600 dark:bg-violet-900/30 dark:text-violet-300"><Sparkles size={21} /></div>
          <div>
            <h1 className="text-2xl font-bold">Agent IA Biblius</h1>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Votre assistant intelligent pour la gestion de bibliothèque.</p>
          </div>
        </div>
        <div className="flex flex-1 flex-col overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
          <div className="flex-1 space-y-4 overflow-y-auto p-5">
            {messages.map((message, index) => {
              const parsed = message.role === 'assistant' ? parseSuggestions(message.text) : null
              return (
                <div key={`${message.role}-${index}`} className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : ''}`}>
                  <div className={`flex max-w-[80%] flex-col gap-2 rounded-xl px-4 py-3 text-sm ${message.role === 'user' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200'}`}>
                    <div className="flex gap-2">
                      {message.role === 'assistant' ? <Bot size={16} className="mt-0.5 shrink-0" /> : <UserRound size={16} className="mt-0.5 shrink-0" />}
                      <span className="whitespace-pre-wrap">{parsed ? parsed.clean : message.text}</span>
                    </div>
                    {parsed && parsed.suggestions.length > 0 && (
                      <div className="flex flex-col gap-1">
                        {parsed.suggestions.map((suggestion, i) => (
                          <ResourceButton key={`${suggestion.id}-${i}`} suggestion={suggestion} onOpen={openResource} />
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
            {busy && <div className="flex items-center gap-2 text-sm text-slate-500"><Loader2 className="animate-spin" size={16} /> Biblius réfléchit...</div>}
          </div>
          <form onSubmit={send} className="flex gap-2 border-t border-slate-200 p-4 dark:border-slate-800">
            <input value={value} onChange={(event) => setValue(event.target.value)} placeholder="Posez une question à Biblius..." className="min-w-0 flex-1 rounded-lg border border-slate-200 bg-transparent px-3 py-2 text-sm outline-none focus:border-blue-500 dark:border-slate-700" />
            <button disabled={busy || !value.trim()} className="rounded-lg bg-blue-600 px-4 text-white disabled:opacity-50" aria-label="Envoyer"><Send size={16} /></button>
          </form>
        </div>
        {error && <p className="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950/30 dark:text-red-300">{error}</p>}
      </div>
    </section>
  )
}