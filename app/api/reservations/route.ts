import { createCollectionHandlers } from '@/lib/api/crud'

const handlers = createCollectionHandlers('reservations')
export const { GET, POST } = handlers
