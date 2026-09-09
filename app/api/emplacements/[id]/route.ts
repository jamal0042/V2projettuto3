import { createItemHandlers } from '@/lib/api/crud'

const handlers = createItemHandlers('locations')
export const { GET, PATCH, DELETE } = handlers
