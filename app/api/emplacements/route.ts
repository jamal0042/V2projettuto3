import { createCollectionHandlers } from '@/lib/api/crud'

const handlers = createCollectionHandlers('locations')
export const { GET, POST } = handlers
