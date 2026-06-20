import { eq } from 'drizzle-orm'

import type { createDb } from './index'
import { taskLists, tasks } from './schema/tasks'

export async function seedDefaultTasksForUser(
  dbInstance: ReturnType<typeof createDb>,
  userId: string,
) {
  const existingLists = await dbInstance
    .select({ id: taskLists.id })
    .from(taskLists)
    .where(eq(taskLists.userId, userId))
    .limit(1)

  if (existingLists.length > 0) {
    return false
  }

  const [inbox] = await dbInstance
    .insert(taskLists)
    .values({
      name: 'Inbox',
      userId,
      createdById: userId,
    })
    .returning({ id: taskLists.id })

  if (!inbox) {
    throw new Error('Failed to seed task list')
  }

  await dbInstance.insert(tasks).values([
    {
      listId: inbox.id,
      title: 'Review API contract',
      createdById: userId,
    },
    {
      listId: inbox.id,
      title: 'Ship tasks reference',
      completed: true,
      createdById: userId,
    },
  ])

  return true
}
