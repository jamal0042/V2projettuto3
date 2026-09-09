import { createItemHandlers } from '@/lib/api/crud'

const handlers = createItemHandlers('penalites')
export const { GET, PATCH, DELETE } = handlers
