'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Database, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import DashboardFrame from './dashboard-frame'

type Resource = 'documents' | 'exemplaires' | 'auteurs' | 'locations' | 'prets' | 'reservations' | 'penalites' | 'members' | 'retours' | 'classifications'

type ResourceConfig = {
  title: string
  description: string
  columns: { key: string; label: string }[]
  select: string
}

const configs: Record<Resource, ResourceConfig> = {
  documents: { title: 'Documents', description: 'Catalogue des documents de la bibliothèque.', columns: [{ key: 'title', label: 'Titre' }, { key: 'type', label: 'Type' }, { key: 'year', label: 'Année' }, { key: 'publisher', label: 'Éditeur' }], select: 'id, title, type, year, publisher' },
  exemplaires: { title: 'Exemplaires', description: 'Suivi des exemplaires physiques et de leur disponibilité.', columns: [{ key: 'barcode', label: 'Code-barres' }, { key: 'inventory_code', label: 'Inventaire' }, { key: 'status', label: 'Statut' }, { key: 'cote_complete', label: 'Cote' }], select: 'id, barcode, inventory_code, status, cote_complete' },
  auteurs: { title: 'Auteurs', description: 'Répertoire des auteurs du catalogue.', columns: [{ key: 'name', label: 'Nom' }, { key: 'nationality', label: 'Nationalité' }, { key: 'birth_year', label: 'Année de naissance' }], select: 'id, name, nationality, birth_year' },
  locations: { title: 'Emplacements', description: 'Organisation des espaces et rayons de la bibliothèque.', columns: [{ key: 'code', label: 'Code' }, { key: 'name', label: 'Nom' }, { key: 'building', label: 'Bâtiment' }, { key: 'level', label: 'Niveau' }], select: 'id, code, name, building, level' },
  prets: { title: 'Emprunts & retours', description: 'Suivi des emprunts actifs et de leur état.', columns: [{ key: 'member_id', label: 'Membre' }, { key: 'exemplaire_id', label: 'Exemplaire' }, { key: 'loan_date', label: 'Départ' }, { key: 'status', label: 'Statut' }], select: 'id, member_id, exemplaire_id, loan_date, status' },
  reservations: { title: 'Réservations', description: 'Réservations en attente et disponibles.', columns: [{ key: 'document_id', label: 'Document' }, { key: 'member_id', label: 'Membre' }, { key: 'reserved_date', label: 'Date' }, { key: 'status', label: 'Statut' }], select: 'id, document_id, member_id, reserved_date, status' },
  penalites: { title: 'Pénalités', description: 'Pénalités associées aux membres et aux emprunts.', columns: [{ key: 'member_id', label: 'Membre' }, { key: 'type', label: 'Type' }, { key: 'amount', label: 'Montant' }, { key: 'status', label: 'Statut' }], select: 'id, member_id, type, amount, status' },
  members: { title: 'Membres', description: 'Membres inscrits dans la bibliothèque.', columns: [{ key: 'first_name', label: 'Prénom' }, { key: 'last_name', label: 'Nom' }, { key: 'email', label: 'Email' }, { key: 'role', label: 'Rôle' }, { key: 'status', label: 'Statut' }], select: 'id, first_name, last_name, email, role, status' },
  retours: { title: 'Retours', description: 'Historique des retours de documents.', columns: [{ key: 'pret_id', label: 'Emprunt' }, { key: 'return_date', label: 'Date' }, { key: 'days_late', label: 'Retard' }, { key: 'book_condition', label: 'État' }], select: 'id, pret_id, return_date, days_late, book_condition' },
  classifications: { title: 'Classifications', description: 'Référentiel Dewey des classifications.', columns: [{ key: 'code', label: 'Code' }, { key: 'libelle', label: 'Libellé' }, { key: 'level', label: 'Niveau' }, { key: 'status', label: 'Statut' }], select: 'id, code, libelle, level, status' },
}

export default function DataPage({ resource }: { resource: Resource }) {
  const config = configs[resource]
  const [rows, setRows] = useState<Record<string, unknown>[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const supabase = createClient()
    supabase.from(resource).select(config.select).order('created_at', { ascending: false }).limit(50).then(({ data, error: queryError }) => {
      if (queryError) setError(queryError.message)
      else setRows((data || []) as unknown as Record<string, unknown>[])
      setLoading(false)
    })
  }, [config.select, resource])

  const activeLabels: Record<Resource, string> = { documents: 'Documents', exemplaires: 'Exemplaires', auteurs: 'Auteurs', locations: 'Emplacements', prets: 'Emprunts & retours', reservations: 'Réservations', penalites: 'Pénalités', members: 'Membres', retours: 'Emprunts & retours', classifications: 'Classifications' }

  return (
    <DashboardFrame active={activeLabels[resource]}>
    <main className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <div className="mx-auto max-w-7xl p-6 lg:p-8">
        <Link href="/dashboard" className="mb-6 inline-flex items-center gap-2 text-sm text-slate-500 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400"><ArrowLeft size={16} /> Retour au dashboard</Link>
        <div className="mb-6 flex items-start justify-between gap-4"><div><p className="mb-1 flex items-center gap-2 text-sm font-medium text-emerald-600 dark:text-emerald-400"><span className="h-2 w-2 rounded-full bg-emerald-500" /> Données en temps réel</p><h1 className="text-2xl font-bold">{config.title}</h1><p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{config.description}</p></div><div className="rounded-xl bg-blue-50 p-3 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400"><Database size={20} /></div></div>
        <section className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
          {loading ? <div className="flex items-center justify-center gap-2 p-12 text-sm text-slate-500"><Loader2 className="animate-spin" size={18} /> Chargement des données...</div> : error ? <div className="p-8 text-sm text-red-600 dark:text-red-400">{error}</div> : rows.length === 0 ? <div className="p-12 text-center text-sm text-slate-500 dark:text-slate-400">Aucune donnée disponible dans cette table.</div> : <div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead className="border-b border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-950"><tr>{config.columns.map((column) => <th key={column.key} className="whitespace-nowrap px-5 py-3 font-semibold text-slate-500 dark:text-slate-400">{column.label}</th>)}</tr></thead><tbody>{rows.map((row) => <tr key={String(row.id)} className="border-b border-slate-100 last:border-0 dark:border-slate-800">{config.columns.map((column) => <td key={column.key} className="whitespace-nowrap px-5 py-3 text-slate-700 dark:text-slate-300">{String(row[column.key] ?? '—')}</td>)}</tr>)}</tbody></table></div>}
        </section>
      </div>
    </main>
    </DashboardFrame>
  )
}
