import { createItemHandlers } from '@/lib/api/crud'

const handlers = createItemHandlers('documents')
export const { GET, PATCH, DELETE } = handlers
