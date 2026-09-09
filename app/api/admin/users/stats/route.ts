import { NextResponse } from 'next/server'
import type { PostgrestError } from '@supabase/supabase-js'
import { requireAdminAccess } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

export async function GET() {
  const admin = createAdminClient()
  const actor = await requireAdminAccess()
  if (!admin) return NextResponse.json({ error: 'Supabase non configurée.' }, { status: 500 })
  if (!actor) return NextResponse.json({ error: 'Accès non autorisé.' }, { status: 403 })

  async function count(query: PromiseLike<{ count: number | null; error: PostgrestError | null }>) {
    const { count, error } = await query
    return { count, error }
  }

  try {
    const [actifs, invitations, expirées, suspendus, inactifs, étudiants, externes] = await Promise.all([
      count(admin.from('members').select('id', { count: 'exact', head: true }).eq('status', 'active')),
      count(admin.from('members').select('id', { count: 'exact', head: true }).eq('status', 'pending').eq('invite_status', 'pending')),
      count(admin.from('members').select('id', { count: 'exact', head: true }).eq('status', 'pending').neq('invite_status', 'pending')),
      count(admin.from('members').select('id', { count: 'exact', head: true }).eq('status', 'suspended')),
      count(admin.from('members').select('id', { count: 'exact', head: true }).eq('status', 'inactive')),
      count(admin.from('members').select('id', { count: 'exact', head: true }).eq('role', 'student')),
      count(admin.from('members').select('id', { count: 'exact', head: true }).eq('role', 'external')),
    ])

    const { count: demandes } = await admin
      .from('membership_requests')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'pending')

    return NextResponse.json({
      data: {
        actifs: actifs.count,
        invitations: invitations.count,
        expirees: expirées.count,
        suspendus: suspendus.count,
        inactifs: inactifs.count,
        etudiants: étudiants.count,
        externes: externes.count,
        demandes: demandes ?? null,
      },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur serveur'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}