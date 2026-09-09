import { createAdminClient } from '@/lib/supabase/admin'

export async function logActivity(
  actorId: string | null,
  action: string,
  entity = 'member',
  entityId: string | null = null,
  details: Record<string, unknown> = {}
) {
  const admin = createAdminClient()
  if (!admin) return { ok: false as const, error: 'Supabase non configurée.' }
  const { error } = await admin
    .from('activity_log')
    .insert({ actor_id: actorId, action, entity, entity_id: entityId, details })
  return { ok: !error, error }
}