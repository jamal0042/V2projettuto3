import { createCollectionHandlers } from '@/lib/api/crud'

const handlers = createCollectionHandlers('documents')
export const { GET, POST } = handlers
