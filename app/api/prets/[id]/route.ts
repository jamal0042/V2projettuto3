import { createItemHandlers } from '@/lib/api/crud'

const handlers = createItemHandlers('prets')
export const { GET, PATCH, DELETE } = handlers
