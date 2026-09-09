import { NextResponse } from 'next/server'
import { requireAdminAccess } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { logActivity } from '@/lib/api/audit'
import { PROFILE_FIELDS, canAssignRole } from '@/lib/api/users'

export const dynamic = 'force-dynamic'

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params
  const admin = createAdminClient()
  const actor = await requireAdminAccess()
  if (!admin) return NextResponse.json({ error: 'Supabase non configurée.' }, { status: 500 })
  if (!actor) return NextResponse.json({ error: 'Accès non autorisé.' }, { status: 403 })

  try {
    const { data: member, error } = await admin.from('members').select('*').eq('id', id).single()
    if (error) return NextResponse.json({ error: error.message }, { status: 404 })

    const { data: authUser } = await admin.auth.admin.getUserById(id)

    return NextResponse.json({
      data: {
        ...member,
        last_sign_in_at: authUser?.user?.last_sign_in_at || null,
        email_confirmed: authUser?.user?.email_confirmed_at ? true : false,
      },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur serveur'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
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

  try {
    const { data: member, error: fetchError } = await admin
      .from('members')
      .select('*')
      .eq('id', id)
      .single()
    if (fetchError) return NextResponse.json({ error: fetchError.message }, { status: 404 })

    const updates: Record<string, unknown> = {}

    for (const field of PROFILE_FIELDS) {
      if (body[field] !== undefined) {
        updates[field] = body[field] === null || String(body[field]).trim() === '' ? null : String(body[field]).trim()
      }
    }

    if (body.role !== undefined) {
      const targetEmail = String(member.email || '')
      const newRole = String(body.role)
      if (actor.id === id)
        return NextResponse.json({ error: 'Impossible de modifier votre propre rôle.' }, { status: 400 })
      const check = canAssignRole(actor.role, String(member.role), newRole, targetEmail)
      if (!check.ok) return NextResponse.json({ error: check.reason }, { status: 403 })
      updates.role = newRole
    }

    const { data: updated, error: updateError } = await admin
      .from('members')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()

    if (updateError) return NextResponse.json({ error: updateError.message }, { status: 400 })

    await logActivity(actor.id, 'user.updated', 'member', id, {
      role_changed: body.role !== undefined,
      role: (body.role as string) || undefined,
    })

    return NextResponse.json({ data: updated })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur serveur'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params
  const admin = createAdminClient()
  const actor = await requireAdminAccess()
  if (!admin) return NextResponse.json({ error: 'Supabase non configurée.' }, { status: 500 })
  if (!actor) return NextResponse.json({ error: 'Accès non autorisé.' }, { status: 403 })

  try {
    const { data: member, error: fetchError } = await admin
      .from('members')
      .select('role, email')
      .eq('id', id)
      .single()
    if (fetchError) return NextResponse.json({ error: fetchError.message }, { status: 404 })

    if (member.role === 'admin')
      return NextResponse.json({ error: 'Un compte administrateur ne peut pas être supprimé.' }, { status: 403 })
    if (actor.id === id)
      return NextResponse.json({ error: 'Vous ne pouvez pas supprimer votre propre compte.' }, { status: 400 })

    const { error: authError } = await admin.auth.admin.deleteUser(id)
    if (authError) return NextResponse.json({ error: authError.message }, { status: 400 })

    const { error: deleteError } = await admin.from('members').delete().eq('id', id)
    if (deleteError) return NextResponse.json({ error: deleteError.message }, { status: 400 })

    await logActivity(actor.id, 'user.deleted', 'member', id, {
      email: member.email,
    })

    return new NextResponse(null, { status: 204 })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur serveur'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}