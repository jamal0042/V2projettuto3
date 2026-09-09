import { createCollectionHandlers } from '@/lib/api/crud'

const handlers = createCollectionHandlers('penalites')
export const { GET, POST } = handlers
