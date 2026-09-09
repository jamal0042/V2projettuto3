import { createCollectionHandlers } from '@/lib/api/crud'

const handlers = createCollectionHandlers('members')
export const { GET, POST } = handlers
