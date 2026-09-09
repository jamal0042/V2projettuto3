'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, CheckCircle2, CircleAlert, Loader2, Mail, UserPlus } from 'lucide-react'
import DashboardFrame from '@/components/dashboard/dashboard-frame'
import { Button, Field, Input, Select } from './ui'

type FormState = {
  first_name: string
  last_name: string
  email: string
  role: string
  phone: string
  matricule: string
  department: string
  level: string
  speciality: string
}

const initialForm: FormState = {
  first_name: '',
  last_name: '',
  email: '',
  role: 'student',
  phone: '',
  matricule: '',
  department: '',
  level: '',
  speciality: '',
}

const ROLE_OPTIONS: { value: string; label: string }[] = [
  { value: 'student', label: 'Étudiant' },
  { value: 'external', label: 'Externe' },
  { value: 'teacher', label: 'Enseignant' },
  { value: 'librarian', label: 'Bibliothécaire' },
]

export default function AddUserPage() {
  const [form, setForm] = useState<FormState>(initialForm)
  const [busy, setBusy] = useState(false)
  const [banner, setBanner] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  const update = (key: keyof FormState, value: string) => setForm((prev) => ({ ...prev, [key]: value }))

  async function submit() {
    setBusy(true)
    setBanner(null)
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Échec de la création du compte')
      setBanner({
        type: 'success',
        message:
          json.invitation?.sent
            ? `Compte créé pour ${json.member.email}. Un email de confirmation a été envoyé au propriétaire du compte.`
            : `Compte créé pour ${json.member.email}, mais l’email d’activation n’a pas pu être envoyé (fournisseur non configuré).`,
      })
      setForm(initialForm)
    } catch (err) {
      setBanner({ type: 'error', message: err instanceof Error ? err.message : 'Erreur' })
    } finally {
      setBusy(false)
    }
  }

  return (
    <DashboardFrame active="Utilisateurs">
      <main className="mx-auto max-w-3xl p-6 lg:p-8">
        <Link
          href="/dashboard/utilisateurs"
          className="inline-flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition mb-4"
        >
          <ArrowLeft size={15} /> Retour aux utilisateurs
        </Link>

        <div className="mb-6">
          <p className="mb-1 flex items-center gap-2 text-sm font-medium text-emerald-600 dark:text-emerald-400">
            <span className="h-2 w-2 rounded-full bg-emerald-500" /> Administration
          </p>
          <h1 className="text-2xl font-bold">Ajouter un utilisateur</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Le propriétaire du compte recevra un email de confirmation pour définir son mot de passe et activer son accès.
          </p>
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

        <section className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Prénom" required>
              <Input value={form.first_name} onChange={(e) => update('first_name', e.target.value)} required placeholder="Ex. Amina" />
            </Field>
            <Field label="Nom" required>
              <Input value={form.last_name} onChange={(e) => update('last_name', e.target.value)} required placeholder="Ex. Mulumba" />
            </Field>
            <Field label="Email" required hint="L’email de confirmation sera envoyé sur cette adresse.">
              <Input type="email" value={form.email} onChange={(e) => update('email', e.target.value)} required placeholder="user@universite.fr" />
            </Field>
            <Field label="Type de compte" required>
              <Select value={form.role} onChange={(e) => update('role', e.target.value)}>
                {ROLE_OPTIONS.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Téléphone">
              <Input value={form.phone} onChange={(e) => update('phone', e.target.value)} placeholder="+243 9 12 34 56 78" />
            </Field>
            <Field label="Matricule">
              <Input value={form.matricule} onChange={(e) => update('matricule', e.target.value)} placeholder="MAT-001" />
            </Field>
            <Field label="Département">
              <Input value={form.department} onChange={(e) => update('department', e.target.value)} placeholder="Informatique" />
            </Field>
            <Field label="Niveau">
              <Input value={form.level} onChange={(e) => update('level', e.target.value)} placeholder="L3, M1…" />
            </Field>
            <Field label="Spécialité" className="sm:col-span-2">
              <Input value={form.speciality} onChange={(e) => update('speciality', e.target.value)} placeholder="IA, Réseaux…" />
            </Field>
          </div>

          <div className="mt-6 flex items-center justify-end gap-3 border-t border-slate-100 dark:border-slate-800 pt-5">
            <Button variant="ghost" onClick={() => setForm(initialForm)} disabled={busy}>
              Réinitialiser
            </Button>
            <Button onClick={submit} loading={busy} disabled={!form.first_name.trim() || !form.last_name.trim() || !form.email.trim()}>
              {busy ? null : <UserPlus size={15} />} Créer le compte
            </Button>
          </div>
        </section>
      </main>
    </DashboardFrame>
  )
}