import { NextResponse } from 'next/server'
import { getCurrentMember, isAdminRole } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

const MONTHS = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc']

const ROLE_LABELS: Record<string, string> = {
  admin: 'Administrateur',
  librarian: 'Bibliothécaire',
  teacher: 'Enseignant',
  student: 'Étudiant',
  external: 'Externe',
}

const EXEMPLAIRE_LABELS: Record<string, string> = {
  available: 'Disponibles',
  loaned: 'Prêtés',
  reserved: 'Réservés',
  maintenance: 'Maintenance',
  lost: 'Perdus',
}

const RESERVATION_LABELS: Record<string, string> = {
  pending: 'En attente',
  ready: 'Disponibles',
  fulfilled: 'Réalisées',
  cancelled: 'Annulées',
  expired: 'Expirées',
}

const PENALITE_LABELS: Record<string, string> = {
  unpaid: 'Impayées',
  paid: 'Payées',
  waived: 'Effacées',
}

const PRET_LABELS: Record<string, string> = {
  active: 'Actifs',
  overdue: 'En retard',
  returned: 'Rendus',
}

type Row = Record<string, unknown>

function monthIndex(value: string | null | undefined): number | null {
  if (!value) return null
  const dt = new Date(String(value))
  if (Number.isNaN(dt.getTime())) return null
  const year = dt.getFullYear()
  if (year < 2000 || year > 2100) return null
  return dt.getMonth()
}

function monthSeries(rows: Row[], key: string) {
  const counts = new Array(12).fill(0)
  for (const row of rows) {
    const m = monthIndex(row[key] as string | null | undefined)
    if (m !== null) counts[m]++
  }
  return MONTHS.map((name, i) => ({ name, value: counts[i] }))
}

function countBy(rows: Row[], key: string, labels?: Record<string, string>) {
  const counts = new Map<string, number>()
  for (const row of rows) {
    const raw = String(row[key] ?? '—')
    const name = labels ? labels[raw] ?? raw : raw
    counts.set(name, (counts.get(name) ?? 0) + 1)
  }
  return [...counts.entries()].map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value)
}

function groupCounts(rows: Row[], nameById: Map<string, string>) {
  const counts = new Map<string, number>()
  for (const row of rows) {
    const raw = row.category_id as string | null
    const id = raw ? String(raw) : null
    const name = id ? nameById.get(id) ?? 'Non classé' : 'Non classé'
    counts.set(name, (counts.get(name) ?? 0) + 1)
  }
  return [...counts.entries()].map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value)
}

function trimTop(points: { name: string; value: number }[], max: number) {
  if (points.length <= max) return points
  const head = points.slice(0, max - 1)
  const rest = points.slice(max - 1).reduce((sum, point) => sum + point.value, 0)
  return [...head, { name: 'Autres', value: rest }]
}

async function buildAdmin() {
  const supabase = await createClient()

  const [pretsRes, retoursRes, exemplairesRes, documentsRes, categoriesRes, membersRes, reservationsRes, penalitesRes, digitalRes] =
    await Promise.all([
      supabase.from('prets').select('id, exemplaire_id, loan_date'),
      supabase.from('retours').select('id, return_date'),
      supabase.from('exemplaires').select('id, document_id, status'),
      supabase.from('documents').select('id, title, category_id'),
      supabase.from('categories').select('id, name'),
      supabase.from('members').select('id, role'),
      supabase.from('reservations').select('id, status'),
      supabase.from('penalites').select('id, status'),
      supabase.from('digital_resources').select('id'),
    ])

  const all = [pretsRes, retoursRes, exemplairesRes, documentsRes, categoriesRes, membersRes, reservationsRes, penalitesRes, digitalRes]
  const failed = all.find((result) => result.error)
  if (failed) throw failed.error

  const prets = (pretsRes.data ?? []) as Row[]
  const retours = (retoursRes.data ?? []) as Row[]
  const exemplaires = (exemplairesRes.data ?? []) as Row[]
  const documents = (documentsRes.data ?? []) as Row[]
  const categories = (categoriesRes.data ?? []) as Row[]
  const members = (membersRes.data ?? []) as Row[]
  const reservations = (reservationsRes.data ?? []) as Row[]
  const penalites = (penalitesRes.data ?? []) as Row[]

  const catName = new Map(categories.map((c) => [String(c.id), String(c.name ?? '')]))
  const exByDoc = new Map(exemplaires.map((e) => [String(e.id), String(e.document_id ?? '')]))
  const docTitle = new Map(documents.map((d) => [String(d.id), String(d.title ?? '—')]))

  const pretsParDate = monthSeries(prets, 'loan_date')
  const retoursParDate = monthSeries(retours, 'return_date')
  const loansByMonth = pretsParDate.map((point, i) => ({
    name: point.name,
    prets: point.value,
    retours: retoursParDate[i].value,
  }))

  const documentsByCategory = trimTop(groupCounts(documents, catName), 8)

  const pretsByDoc = new Map<string, number>()
  for (const row of prets) {
    const docId = exByDoc.get(String(row.exemplaire_id ?? '')) ?? '—'
    pretsByDoc.set(docId, (pretsByDoc.get(docId) ?? 0) + 1)
  }
  const topDocuments = [...pretsByDoc.entries()]
    .map(([docId, value]) => ({ name: docTitle.get(docId) ?? 'Document non renseigné', value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 6)

  return {
    view: 'admin' as const,
    kpis: {
      prets: prets.length,
      retours: retours.length,
      documents: documents.length,
      membres: members.length,
      exemplairesDisponibles: exemplaires.filter((e) => e.status === 'available').length,
      reservationsEnAttente: reservations.filter((r) => r.status === 'pending').length,
      penalitesImpayees: penalites.filter((p) => p.status === 'unpaid').length,
      ressourcesNumeriques: (digitalRes.data ?? []).length,
    },
    loansByMonth,
    documentsByCategory,
    topDocuments,
    membersByRole: countBy(members, 'role', ROLE_LABELS),
    exemplairesByStatus: countBy(exemplaires, 'status', EXEMPLAIRE_LABELS),
    reservationsByStatus: countBy(reservations, 'status', RESERVATION_LABELS),
    penalitesByStatus: countBy(penalites, 'status', PENALITE_LABELS),
  }
}

async function buildPersonal(memberId: string) {
  const supabase = await createClient()

  const [pretsRes, exemplairesRes, documentsRes, categoriesRes, reservationsRes, penalitesRes] = await Promise.all([
    supabase.from('prets').select('id, exemplaire_id, loan_date, status').eq('member_id', memberId),
    supabase.from('exemplaires').select('id, document_id'),
    supabase.from('documents').select('id, title, category_id'),
    supabase.from('categories').select('id, name'),
    supabase.from('reservations').select('id, status').eq('member_id', memberId),
    supabase.from('penalites').select('id, status, amount').eq('member_id', memberId),
  ])

  const all = [pretsRes, exemplairesRes, documentsRes, categoriesRes, reservationsRes, penalitesRes]
  const failed = all.find((result) => result.error)
  if (failed) throw failed.error

  const prets = (pretsRes.data ?? []) as Row[]
  const exemplaires = (exemplairesRes.data ?? []) as Row[]
  const documents = (documentsRes.data ?? []) as Row[]
  const categories = (categoriesRes.data ?? []) as Row[]
  const reservations = (reservationsRes.data ?? []) as Row[]
  const penalites = (penalitesRes.data ?? []) as Row[]

  const catName = new Map(categories.map((c) => [String(c.id), String(c.name ?? '')]))
  const exByDoc = new Map(exemplaires.map((e) => [String(e.id), String(e.document_id ?? '')]))
  const docCategory = new Map(documents.map((d) => [String(d.id), d.category_id ? String(d.category_id) : null]))

  const borrowedDocIds = prets
    .map((row) => exByDoc.get(String(row.exemplaire_id ?? '')))
    .filter((id): id is string => Boolean(id))

  const categoryRows = [...new Set(borrowedDocIds)].map((docId) => ({ category_id: docCategory.get(docId) ?? null }))
  const userCategories = trimTop(groupCounts(categoryRows, catName), 6)

  const myLoans = countBy(prets, 'status', PRET_LABELS)
  const myLoansByMonth = monthSeries(prets, 'loan_date')
  const myReservations = countBy(reservations, 'status', RESERVATION_LABELS)
  const unpaid = penalites.filter((p) => p.status === 'unpaid')
  const totalPenalty = penalites.reduce((sum, p) => sum + (Number(p.amount) || 0), 0)

  return {
    view: 'user' as const,
    kpis: {
      emprunts: prets.length,
      actifs: prets.filter((p) => p.status === 'active').length,
      retards: prets.filter((p) => p.status === 'overdue').length,
      reservations: reservations.length,
      penalitesImpayees: unpaid.length,
      penalitesTotal: totalPenalty,
    },
    loansByMonth: myLoansByMonth.map((point) => ({ name: point.name, prets: point.value, retours: 0 })),
    topDocuments: [],
    documentsByCategory: userCategories,
    membersByRole: [],
    exemplairesByStatus: [],
    reservationsByStatus: myReservations,
    penalitesByStatus: countBy(penalites, 'status', PENALITE_LABELS),
    myLoans,
  }
}

export async function GET() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return NextResponse.json(
      {
        configured: false,
        error: 'Supabase non configurée. Renseignez NEXT_PUBLIC_SUPABASE_URL et NEXT_PUBLIC_SUPABASE_ANON_KEY dans les variables d’environnement de la plateforme de déploiement.',
      },
      { status: 503 }
    )
  }

  const member = await getCurrentMember()
  if (!member) return NextResponse.json({ error: 'Accès non autorisé.' }, { status: 401 })

  try {
    const data = isAdminRole(member.role) ? await buildAdmin() : await buildPersonal(member.id)
    return NextResponse.json(data)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur serveur'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}