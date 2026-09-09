import { createItemHandlers } from '@/lib/api/crud'

const handlers = createItemHandlers('reservations')
export const { GET, PATCH, DELETE } = handlers
