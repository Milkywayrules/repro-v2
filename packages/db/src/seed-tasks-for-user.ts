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

  const [sampleList] = await dbInstance
    .insert(taskLists)
    .values({
      name: 'Sample tasks (safe to delete)',
      userId,
      workspaceId,
      createdById: userId,
    })
    .returning({ id: taskLists.id })

  if (!sampleList) {
    throw new Error('Failed to seed task list')
  }

  await dbInstance.insert(tasks).values([
    {
      listId: sampleList.id,
      workspaceId,
      title: 'Try checking this off — demo only',
      createdById: userId,
    },
    {
      listId: sampleList.id,
      workspaceId,
      title: 'Add your own task — this list is disposable',
      completed: true,
      createdById: userId,
    },
  ])

  return true
}
