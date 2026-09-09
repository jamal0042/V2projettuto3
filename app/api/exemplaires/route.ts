import { createCollectionHandlers } from '@/lib/api/crud'

const handlers = createCollectionHandlers('exemplaires')
export const { GET, POST } = handlers
