import { createItemHandlers } from '@/lib/api/crud'

const handlers = createItemHandlers('members')
export const { GET, PATCH, DELETE } = handlers
