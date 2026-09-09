import { NextResponse } from 'next/server'
import { requireAdminAccess } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { logActivity } from '@/lib/api/audit'

export const dynamic = 'force-dynamic'

const LOAN_STATUSES = ['active', 'overdue'] as const
const CONDITIONS = ['good', 'damaged', 'lost'] as const

type LoanRow = {
  id: string
  member_id: string
  exemplaire_id: string
  due_date: string
  status: string
  members?: { first_name: string | null; last_name: string | null; email: string | null } | null
  exemplaires?: { barcode: string | null; cote_complete: string | null; documents?: { title: string | null } | null } | null
}
type RowMember = { first_name: string | null; last_name: string | null; email: string | null }
type RowCopy = { barcode: string | null; cote_complete: string | null; documents: { title: string | null } | null }

function toDate(value: string) {
  const [y, m, d] = String(value).split('-').map(Number)
  return new Date(y, (m || 1) - 1, d || 1)
}

function daysLate(dueDate: string, returnDay: Date) {
  const due = toDate(dueDate)
  const diff = Math.round((returnDay.getTime() - due.getTime()) / 86400000)
  return Math.max(0, diff)
}

export async function GET() {
  const admin = createAdminClient()
  const actor = await requireAdminAccess()
  if (!admin) return NextResponse.json({ error: 'Supabase non configurée.' }, { status: 500 })
  if (!actor) return NextResponse.json({ error: 'Accès non autorisé.' }, { status: 403 })

  try {
    const { data, error } = await admin
      .from('prets')
      .select('id, member_id, exemplaire_id, due_date, status, members(first_name, last_name, email), exemplaires(barcode, cote_complete, documents(title))')
      .in('status', LOAN_STATUSES)
      .order('due_date', { ascending: true })

    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
    const rows = ((data as unknown as { id: string; member_id: string; exemplaire_id: string; due_date: string; status: string; members?: RowMember[]; exemplaires?: RowCopy[] }[]) || []).map((row) => ({
      id: row.id,
      member_id: row.member_id,
      exemplaire_id: row.exemplaire_id,
      due_date: row.due_date,
      status: row.status,
      members: row.members?.[0] ?? null,
      exemplaires: row.exemplaires?.[0] ?? null,
    }))
    return NextResponse.json({ data: rows as LoanRow[] })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur serveur'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const admin = createAdminClient()
  const actor = await requireAdminAccess()
  if (!admin) return NextResponse.json({ error: 'Supabase non configurée.' }, { status: 500 })
  if (!actor) return NextResponse.json({ error: 'Accès non autorisé.' }, { status: 403 })

  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Corps de requête invalide.' }, { status: 400 })
  }

  const pretId = String(body.pret_id || '')
  const bookCondition = String(body.book_condition || 'good')
  if (!pretId) return NextResponse.json({ error: 'Prêt non précisé.' }, { status: 400 })
  if (!(CONDITIONS as readonly string[]).includes(bookCondition))
    return NextResponse.json({ error: 'État du livre invalide.' }, { status: 400 })
  const notes = String(body.notes || '').trim() || null
  const returnDateValue = String(body.return_date || '').trim()
  const returnDay = returnDateValue ? toDate(returnDateValue) : new Date()

  try {
    const { data: loan, error: loanError } = await admin
      .from('prets')
      .select('id, member_id, exemplaire_id, due_date, status')
      .eq('id', pretId)
      .single()
    if (loanError || !loan) return NextResponse.json({ error: 'Prêt introuvable.' }, { status: 404 })
    if (!(LOAN_STATUSES as readonly string[]).includes(loan.status))
      return NextResponse.json({ error: 'Ce prêt n’est plus actif.' }, { status: 409 })

    const late = daysLate(loan.due_date, returnDay)

    const { data: settings } = await admin
      .from('settings')
      .select('penalty_per_day_late, penalty_lost_book, penalty_damaged_book')
      .eq('id', 1)
      .maybeSingle()

    const perDay = Number(settings?.penalty_per_day_late) > 0 ? Number(settings?.penalty_per_day_late) : 100
    const lostAmount = Number(settings?.penalty_lost_book) > 0 ? Number(settings?.penalty_lost_book) : 15000
    const damagedAmount = Number(settings?.penalty_damaged_book) > 0 ? Number(settings?.penalty_damaged_book) : 5000

    const penaltyRows: { member_id: string; pret_id: string; type: string; amount: number; days?: number; reason: string }[] = []
    const latePayment = late > 0 ? late * perDay : 0
    const conditionPayment =
      bookCondition === 'lost' ? lostAmount : bookCondition === 'damaged' ? damagedAmount : 0
    if (latePayment > 0)
      penaltyRows.push({
        member_id: loan.member_id,
        pret_id: loan.id,
        type: 'late',
        amount: latePayment,
        days: late,
        reason: `Retour avec ${late} jour(s) de retard`,
      })
    if (bookCondition === 'damaged')
      penaltyRows.push({ member_id: loan.member_id, pret_id: loan.id, type: 'damage', amount: damagedAmount, reason: 'Exemplaire retourné endommagé' })
    if (bookCondition === 'lost')
      penaltyRows.push({ member_id: loan.member_id, pret_id: loan.id, type: 'lost', amount: lostAmount, reason: 'Exemplaire retourné perdu' })

    const returnTimestamp = new Date().toISOString()

    const { error: retourError } = await admin.from('retours').insert({
      pret_id: loan.id,
      return_date: returnTimestamp,
      days_late: late,
      penalty_amount: latePayment + conditionPayment,
      book_condition: bookCondition,
      notes,
    })
    if (retourError) return NextResponse.json({ error: retourError.message }, { status: 400 })

    const { error: pretError } = await admin.from('prets').update({ status: 'returned' }).eq('id', loan.id)
    if (pretError) return NextResponse.json({ error: pretError.message }, { status: 400 })

    const exemplaireStatus = bookCondition === 'lost' ? 'lost' : 'available'
    const { error: copyError } = await admin.from('exemplaires').update({ status: exemplaireStatus }).eq('id', loan.exemplaire_id)
    if (copyError) return NextResponse.json({ error: copyError.message }, { status: 400 })

    if (penaltyRows.length > 0) {
      const { error: penaliteError } = await admin.from('penalites').insert(penaltyRows)
      if (penaliteError) return NextResponse.json({ error: penaliteError.message }, { status: 400 })
    }

    await logActivity(actor.id, 'return.created', 'retour', loan.id, {
      pret_id: loan.id,
      days_late: late,
      book_condition: bookCondition,
      penalties: penaltyRows.length,
    })

    return NextResponse.json({ ok: true, days_late: late, book_condition: bookCondition, penalties: penaltyRows.length }, { status: 201 })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur serveur'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}