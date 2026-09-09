import { NextResponse } from 'next/server'
import { requireAdminAccess } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { logActivity } from '@/lib/api/audit'
import { canChangeStatus } from '@/lib/api/users'

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params
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

  const value = String(body.value || '')
  const actions: Record<string, string> = {
    active: 'user.reactivated',
    suspended: 'user.suspended',
    inactive: 'user.disabled',
  }

  try {
    const { data: member, error: fetchError } = await admin
      .from('members')
      .select('*')
      .eq('id', id)
      .single()
    if (fetchError) return NextResponse.json({ error: fetchError.message }, { status: 404 })

    if (!(value in actions)) {
      return NextResponse.json({ error: 'Statut cible invalide.' }, { status: 400 })
    }
    if (member.role === 'admin' && value !== 'active' && actor.id !== id) {
      return NextResponse.json(
        { error: 'Le statut d’un administrateur ne peut pas être modifié.' },
        { status: 403 }
      )
    }
    if (!canChangeStatus(String(member.status), value)) {
      return NextResponse.json(
        { error: `Transition non autorisée depuis le statut « ${member.status} ».` },
        { status: 400 }
      )
    }

    const { data: updated, error: updateError } = await admin
      .from('members')
      .update({ status: value, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()
    if (updateError) return NextResponse.json({ error: updateError.message }, { status: 400 })

    await logActivity(actor.id, actions[value], 'member', id, {
      from: member.status,
      to: value,
    })

    return NextResponse.json({ data: updated })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur serveur'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}