import { createCollectionHandlers } from '@/lib/api/crud'

const handlers = createCollectionHandlers('categories')
export const { GET, POST } = handlers
