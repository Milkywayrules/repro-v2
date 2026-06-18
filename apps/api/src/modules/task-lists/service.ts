import { db } from '@repro-v2/db'
import { listWithOffset } from '@repro-v2/db/list'
import { taskLists, tasks } from '@repro-v2/db/schema/tasks'
import { and, desc, eq, isNull } from 'drizzle-orm'

import type { SortField } from '@/libs/contract/meta'
import { internalServerError, notFoundError } from '@/libs/errors'
import { buildSortOrderBy } from '@/libs/queries/sort-order'
import { serializeAuditTimestamps } from '@/libs/serialize-audit'

export function toTaskListResponse(row: typeof taskLists.$inferSelect) {
  return {
    id: row.id,
    name: row.name,
    ...serializeAuditTimestamps(row),
  }
}

function activeOwnedTaskListWhere(userId: string, id: string) {
  return and(
    eq(taskLists.id, id),
    eq(taskLists.userId, userId),
    isNull(taskLists.deletedAt),
  )
}

export async function listTaskLists(
  userId: string,
  page: number,
  pageSize: number,
  sort: SortField[] = [],
) {
  return await listWithOffset<typeof taskLists.$inferSelect>({
    db,
    table: taskLists,
    where: and(eq(taskLists.userId, userId), isNull(taskLists.deletedAt)),
    orderBy: buildSortOrderBy(
      sort,
      { name: taskLists.name },
      desc(taskLists.createdAt),
    ),
    page,
    pageSize,
  })
}

export async function createTaskList(userId: string, name: string) {
  const [row] = await db
    .insert(taskLists)
    .values({
      name,
      userId,
      createdById: userId,
    })
    .returning()

  if (!row) {
    throw internalServerError()
  }

  return row
}

export async function getTaskListForUser(userId: string, id: string) {
  const [row] = await db
    .select()
    .from(taskLists)
    .where(activeOwnedTaskListWhere(userId, id))
    .limit(1)

  if (!row) {
    throw notFoundError()
  }

  return row
}

export async function updateTaskList(userId: string, id: string, name: string) {
  await getTaskListForUser(userId, id)

  const [row] = await db
    .update(taskLists)
    .set({
      name,
      updatedById: userId,
    })
    .where(activeOwnedTaskListWhere(userId, id))
    .returning()

  if (!row) {
    throw notFoundError()
  }

  return row
}

export async function deleteTaskList(userId: string, id: string) {
  await getTaskListForUser(userId, id)
  const now = new Date()

  return await db.transaction(async tx => {
    await tx
      .update(tasks)
      .set({
        deletedAt: now,
        deletedById: userId,
      })
      .where(and(eq(tasks.listId, id), isNull(tasks.deletedAt)))

    const [row] = await tx
      .update(taskLists)
      .set({
        deletedAt: now,
        deletedById: userId,
      })
      .where(activeOwnedTaskListWhere(userId, id))
      .returning()

    if (!row) {
      throw notFoundError()
    }

    return row
  })
}
