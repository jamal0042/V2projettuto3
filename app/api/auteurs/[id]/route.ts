import { createItemHandlers } from '@/lib/api/crud'

const handlers = createItemHandlers('auteurs')
export const { GET, PATCH, DELETE } = handlers
