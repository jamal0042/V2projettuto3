import { createCollectionHandlers } from '@/lib/api/crud'

const handlers = createCollectionHandlers('auteurs')
export const { GET, POST } = handlers
