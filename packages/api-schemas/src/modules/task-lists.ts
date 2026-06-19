import { z } from 'zod'

import { idParams } from '../shared/id'

export const createTaskListBody = z.object({
  name: z.string().trim().min(1).max(255),
})

export const updateTaskListBody = z.object({
  name: z.string().trim().min(1).max(255).optional(),
})

export const taskListIdParams = idParams
