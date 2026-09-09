import { createCollectionHandlers } from '@/lib/api/crud'

const handlers = createCollectionHandlers('prets')
export const { GET, POST } = handlers
