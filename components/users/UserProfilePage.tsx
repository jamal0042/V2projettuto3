'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, CheckCircle2, CircleAlert, Loader2, Mail, RefreshCw, Trash2 } from 'lucide-react'
import DashboardFrame from '@/components/dashboard/dashboard-frame'
import { Button, EmptyState, Modal, Select } from './ui'
import { RoleBadge, StatusBadge } from './badges'
import { avatarColor, formatDate, formatDateTime, getInitials, type Member } from './user-types'

type Banner = { type: 'success' | 'error'; message: string } | null

export default function UserProfilePage({ id }: { id: string }) {
  const [member, setMember] = useState<Member | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [banner, setBanner] = useState<Banner>(null)
  const [busy, setBusy] = useState(false)
  const [confirm, setConfirm] = useState<{ title: string; description: string; action: string } | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`/api/admin/users/${id}`)
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Erreur de chargement')
      setMember(json.data as Member)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur de chargement')
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    load()
  }, [load])

  async function runAction(action: string) {
    if (!member) return
    setBusy(true)
    setBanner(null)
    try {
      if (action === 'resend') {
        const res = await fetch(`/api/admin/users/${member.id}/invitation`, { method: 'POST' })
        const json = await res.json()
        if (!res.ok) throw new Error(json.error || 'Échec du renvoi')
        setBanner({
          type: json.invitation.sent ? 'success' : 'error',
          message: json.invitation.sent
            ? `Email d’activation renvoyé à ${member.email}.`
            : 'Compte invité mais email non envoyé (fournisseur non configuré).',
        })
      } else if (action === 'delete') {
        const res = await fetch(`/api/admin/users/${member.id}`, { method: 'DELETE' })
        const json = await res.json().catch(() => ({}))
        if (!res.ok) throw new Error(json.error || 'Échec de la suppression')
        setBanner({ type: 'success', message: 'Compte supprimé.' })
        window.location.href = '/dashboard/utilisateurs'
        return
      } else {
        const res = await fetch(`/api/admin/users/${member.id}/status`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ value: action }),
        })
        const json = await res.json()
        if (!res.ok) throw new Error(json.error || 'Échec de l’opération')
        setBanner({ type: 'success', message: 'Statut mis à jour.' })
        load()
      }
    } catch (err) {
      setBanner({ type: 'error', message: err instanceof Error ? err.message : 'Erreur' })
    } finally {
      setBusy(false)
    }
  }

  const infoRows: { label: string; value: string }[] = member
    ? [
        { label: 'Matricule', value: member.matricule || '—' },
        { label: 'Téléphone', value: member.phone || '—' },
        { label: 'Département', value: member.department || '—' },
        { label: 'Niveau', value: member.level || '—' },
        { label: 'Spécialité', value: member.speciality || '—' },
        { label: 'Ville', value: member.city || '—' },
        { label: 'Adresse', value: member.address || '—' },
        { label: 'Email confirmé', value: member.email_confirmed ? 'Oui' : 'Non' },
        { label: 'Dernière connexion', value: member.last_sign_in_at ? formatDateTime(member.last_sign_in_at) : 'Jamais' },
        { label: 'Créé le', value: formatDate(member.created_at) },
      ]
    : []

  return (
    <DashboardFrame active="Utilisateurs">
      <main className="mx-auto max-w-4xl p-6 lg:p-8">
        <Link
          href="/dashboard/utilisateurs"
          className="inline-flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition mb-4"
        >
          <ArrowLeft size={15} /> Retour aux utilisateurs
        </Link>

        {loading ? (
          <div className="flex items-center justify-center gap-2 p-14 text-sm text-slate-500 dark:text-slate-400">
            <Loader2 size={18} className="animate-spin" /> Chargement du profil…
          </div>
        ) : error ? (
          <div className="p-10 text-center text-sm text-red-600 dark:text-red-400">{error}</div>
        ) : !member ? (
          <EmptyState icon={<CircleAlert size={20} />} title="Utilisateur introuvable" description="Ce profil n’existe pas ou a été supprimé." />
        ) : (
          <>
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

            <section className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl mb-6">
              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                <div
                  className="w-14 h-14 rounded-full flex items-center justify-center text-base font-bold text-white shrink-0"
                  style={{ backgroundColor: avatarColor(`${member.first_name} ${member.last_name}`) }}
                >
                  {getInitials(member.first_name, member.last_name)}
                </div>
                <div className="flex-1 min-w-0">
                  <h1 className="text-xl font-bold truncate">
                    {member.first_name} {member.last_name}
                  </h1>
                  <div className="flex flex-wrap items-center gap-2 mt-1">
                    <RoleBadge role={member.role} />
                    <StatusBadge member={member} />
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Button variant="secondary" size="sm" loading={busy} onClick={() => setConfirm({ title: 'Renvoyer l’invitation', description: `Envoyer un nouvel email d’activation à ${member.email} ?`, action: 'resend' })}>
                    {busy ? null : <RefreshCw size={14} />} Renvoyer l’email
                  </Button>
                  {member.role !== 'admin' && (
                    <Button variant="danger" size="sm" loading={busy} onClick={() => setConfirm({ title: 'Supprimer le compte', description: `Supprimer définitivement le compte de ${member.first_name} ${member.last_name} ?`, action: 'delete' })}>
                      {busy ? null : <Trash2 size={14} />} Supprimer
                    </Button>
                  )}
                </div>
              </div>
              <div className="mt-5 flex flex-wrap items-center gap-3 border-t border-slate-100 dark:border-slate-800 pt-4">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Statut</span>
                {['active', 'suspended', 'inactive'].map((s) => (
                  <Button
                    key={s}
                    variant={member.status === s ? 'primary' : 'ghost'}
                    size="sm"
                    disabled={busy || (member.role === 'admin' && s !== 'active')}
                    onClick={() => setConfirm({
                      title: `Passer en « ${s === 'active' ? 'Actif' : s === 'suspended' ? 'Suspendu' : 'Inactif'} »`,
                      description: `Confirmer le changement de statut pour ${member.first_name} ${member.last_name} ?`,
                      action: s,
                    })}
                  >
                    {s === 'active' ? 'Actif' : s === 'suspended' ? 'Suspendre' : 'Désactiver'}
                  </Button>
                ))}
              </div>
            </section>

            <section className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4 p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl">
              {infoRows.map((row) => (
                <div key={row.label} className="flex items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-2 last:border-0">
                  <span className="text-xs font-medium text-slate-400">{row.label}</span>
                  <span className="text-sm text-slate-700 dark:text-slate-200 text-right">{row.value}</span>
                </div>
              ))}
            </section>

            <Modal
              open={Boolean(confirm)}
              onClose={() => setConfirm(null)}
              title={confirm?.title || ''}
              description={confirm?.description}
              danger={confirm?.action === 'delete' || confirm?.action === 'suspended' || confirm?.action === 'inactive'}
              footer={
                <>
                  <Button variant="ghost" onClick={() => setConfirm(null)} disabled={busy}>
                    Annuler
                  </Button>
                  <Button
                    variant={confirm?.action === 'delete' || confirm?.action === 'suspended' || confirm?.action === 'inactive' ? 'danger' : 'primary'}
                    loading={busy}
                    onClick={() => {
                      if (confirm) runAction(confirm.action)
                      setConfirm(null)
                    }}
                  >
                    Confirmer
                  </Button>
                </>
              }
            />
          </>
        )}
      </main>
    </DashboardFrame>
  )
}