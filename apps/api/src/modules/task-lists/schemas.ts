import { z } from 'zod'

import { idParams } from '@/libs/schemas/id-params'

export const createTaskListBody = z.object({
  name: z.string().trim().min(1).max(255),
})

export const updateTaskListBody = z.object({
  name: z.string().trim().min(1).max(255).optional(),
})

export const taskListIdParams = idParams
