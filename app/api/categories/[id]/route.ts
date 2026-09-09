import { createItemHandlers } from '@/lib/api/crud'

const handlers = createItemHandlers('categories')
export const { GET, PATCH, DELETE } = handlers
