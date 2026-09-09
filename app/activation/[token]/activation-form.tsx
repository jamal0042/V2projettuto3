'use client'

import { FormEvent, useState } from 'react'
import { Check, Eye, EyeOff, Library, Loader2, LockKeyhole, Mail, Moon, Sun } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function ActivationForm({ token }: { token: string }) {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [show, setShow] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [darkMode, setDarkMode] = useState(false)

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setBusy(true)
    setError('')
    setMessage('')
    if (password.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caractères.')
      setBusy(false)
      return
    }
    if (password !== confirm) {
      setError('Les deux mots de passe ne correspondent pas.')
      setBusy(false)
      return
    }
    try {
      const res = await fetch('/api/invitations/accept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Activation impossible')
      setMessage('Votre compte est activé. Vous pouvez maintenant vous connecter.')
      setTimeout(() => router.replace('/auth'), 1500)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de l’activation')
    } finally {
      setBusy(false)
    }
  }

  const input = 'w-full px-3 py-2.5 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition text-slate-900 dark:text-slate-100'

  return (
    <main className={`${darkMode ? 'dark bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'} min-h-screen flex items-center justify-center p-4 transition-colors`}>
      <div className="w-full max-w-md">
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl p-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <span className="w-9 h-9 bg-blue-600 text-white rounded-lg flex items-center justify-center"><Library size={16} /></span>
              <span><strong className="block text-sm">Biblius</strong><small className="block text-[11px] text-slate-500 dark:text-slate-400">Activation de compte</small></span>
            </div>
            <button
              type="button"
              className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              onClick={() => setDarkMode((current) => !current)}
              aria-label="Changer de thème"
            >
              {darkMode ? <Sun size={15} /> : <Moon size={15} />}
            </button>
          </div>

          <h1 className="text-lg font-bold mb-1">Définissez votre mot de passe</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
            Ce lien d’activation vous a été envoyé par email après la confirmation de votre compte par un administrateur.
          </p>

          <form onSubmit={submit} className="space-y-4">
            <label className="block">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1 block">Nouveau mot de passe *</span>
              <div className="relative">
                <LockKeyhole size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type={show ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Au moins 8 caractères"
                  className={`${input} pl-9 pr-10`}
                  required
                />
                <button type="button" onClick={() => setShow(!show)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300" aria-label="Afficher le mot de passe">
                  {show ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </label>

            <label className="block">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1 block">Confirmer le mot de passe *</span>
              <div className="relative">
                <LockKeyhole size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type={show ? 'text' : 'password'}
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  placeholder="Répétez le mot de passe"
                  className={`${input} pl-9`}
                  required
                />
              </div>
            </label>

            {error && <p className="rounded-lg bg-red-50 dark:bg-red-950/30 px-3 py-2.5 text-xs text-red-700 dark:text-red-300">{error}</p>}
            {message && (
              <p className="flex items-center gap-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 px-3 py-2.5 text-xs text-emerald-700 dark:text-emerald-300">
                <Check size={14} /> {message}
              </p>
            )}

            <button
              type="submit"
              disabled={busy}
              className="w-full h-11 flex items-center justify-center gap-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold disabled:opacity-70 transition"
            >
              {busy ? <Loader2 size={16} className="animate-spin" /> : <Mail size={15} />} Activer mon compte
            </button>
          </form>

          <p className="text-center mt-6 text-[11px] text-slate-400 dark:text-slate-500">
            Ce lien est temporaire et expire sous 72 heures.
          </p>
        </div>
      </div>
    </main>
  )
}