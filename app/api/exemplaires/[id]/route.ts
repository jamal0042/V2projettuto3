import { createItemHandlers } from '@/lib/api/crud'

const handlers = createItemHandlers('exemplaires')
export const { GET, PATCH, DELETE } = handlers
