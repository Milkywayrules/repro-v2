import { z } from 'zod'

import { idParams } from '../shared/id'

export const taskListFilterQuery = z.object({
  listId: z.uuid().optional(),
})

export const createTaskBody = z.object({
  title: z.string().trim().min(1).max(500),
  listId: z.uuid(),
})

export const updateTaskBody = z.object({
  title: z.string().trim().min(1).max(500).optional(),
  completed: z.boolean().optional(),
})

export const taskIdParams = idParams
