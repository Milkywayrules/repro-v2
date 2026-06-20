import { and, eq } from 'drizzle-orm'

import type { createDb } from './index'
import { taskLists, tasks } from './schema/tasks'

export async function seedDefaultTasksForUser(
  dbInstance: ReturnType<typeof createDb>,
  userId: string,
  workspaceId: string,
) {
  const existingLists = await dbInstance
    .select({ id: taskLists.id })
    .from(taskLists)
    .where(
      and(eq(taskLists.userId, userId), eq(taskLists.workspaceId, workspaceId)),
    )
    .limit(1)

  if (existingLists.length > 0) {
    return false
  }

  const [inbox] = await dbInstance
    .insert(taskLists)
    .values({
      name: 'Inbox',
      userId,
      workspaceId,
      createdById: userId,
    })
    .returning({ id: taskLists.id })

  if (!inbox) {
    throw new Error('Failed to seed task list')
  }

  await dbInstance.insert(tasks).values([
    {
      listId: inbox.id,
      workspaceId,
      title: 'Review API contract',
      createdById: userId,
    },
    {
      listId: inbox.id,
      workspaceId,
      title: 'Ship tasks reference',
      completed: true,
      createdById: userId,
    },
  ])

  return true
}
