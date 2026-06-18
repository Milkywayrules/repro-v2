import { db } from '@repro-v2/db'
import { listWithOffset } from '@repro-v2/db/list'
import { taskLists, tasks } from '@repro-v2/db/schema/tasks'
import { and, desc, eq, inArray, isNull } from 'drizzle-orm'

import type { SortField } from '@/libs/contract/meta'
import { internalServerError, notFoundError } from '@/libs/errors'
import { buildSortOrderBy } from '@/libs/queries/sort-order'
import { serializeAuditTimestamps } from '@/libs/serialize-audit'
import { getTaskListForUser } from '@/modules/task-lists/service'

export function toTaskResponse(row: typeof tasks.$inferSelect) {
  return {
    id: row.id,
    listId: row.listId,
    title: row.title,
    completed: row.completed,
    ...serializeAuditTimestamps(row),
  }
}

function ownedListIdsSubquery(userId: string) {
  return db
    .select({ id: taskLists.id })
    .from(taskLists)
    .where(and(eq(taskLists.userId, userId), isNull(taskLists.deletedAt)))
}

function ownedTaskWhere(userId: string, taskId: string) {
  return and(
    eq(tasks.id, taskId),
    isNull(tasks.deletedAt),
    inArray(tasks.listId, ownedListIdsSubquery(userId)),
  )
}

function tasksListWhere(userId: string, listId?: string) {
  if (listId) {
    return and(eq(tasks.listId, listId), isNull(tasks.deletedAt))
  }

  return and(
    isNull(tasks.deletedAt),
    inArray(tasks.listId, ownedListIdsSubquery(userId)),
  )
}

export async function listTasks(
  userId: string,
  page: number,
  pageSize: number,
  listId?: string,
  sort: SortField[] = [],
) {
  if (listId) {
    await getTaskListForUser(userId, listId)
  }

  return await listWithOffset<typeof tasks.$inferSelect>({
    db,
    table: tasks,
    where: tasksListWhere(userId, listId),
    orderBy: buildSortOrderBy(
      sort,
      { title: tasks.title },
      desc(tasks.createdAt),
    ),
    page,
    pageSize,
  })
}

export async function createTask(
  userId: string,
  input: { title: string; listId: string },
) {
  return await db.transaction(async tx => {
    const [list] = await tx
      .select({ id: taskLists.id })
      .from(taskLists)
      .where(
        and(
          eq(taskLists.id, input.listId),
          eq(taskLists.userId, userId),
          isNull(taskLists.deletedAt),
        ),
      )
      .limit(1)

    if (!list) {
      throw notFoundError()
    }

    const [row] = await tx
      .insert(tasks)
      .values({
        title: input.title,
        listId: input.listId,
        createdById: userId,
      })
      .returning()

    if (!row) {
      throw internalServerError()
    }

    return row
  })
}

export async function getTaskForUser(userId: string, id: string) {
  const [row] = await db
    .select({
      id: tasks.id,
      listId: tasks.listId,
      title: tasks.title,
      completed: tasks.completed,
      createdAt: tasks.createdAt,
      updatedAt: tasks.updatedAt,
      deletedAt: tasks.deletedAt,
    })
    .from(tasks)
    .innerJoin(taskLists, eq(tasks.listId, taskLists.id))
    .where(
      and(
        eq(tasks.id, id),
        eq(taskLists.userId, userId),
        isNull(tasks.deletedAt),
        isNull(taskLists.deletedAt),
      ),
    )
    .limit(1)

  if (!row) {
    throw notFoundError()
  }

  return row
}

export async function updateTask(
  userId: string,
  id: string,
  input: { title?: string; completed?: boolean },
) {
  await getTaskForUser(userId, id)

  const [row] = await db
    .update(tasks)
    .set({
      ...(input.title === undefined ? {} : { title: input.title }),
      ...(input.completed === undefined ? {} : { completed: input.completed }),
      updatedById: userId,
    })
    .where(ownedTaskWhere(userId, id))
    .returning()

  if (!row) {
    throw notFoundError()
  }

  return row
}

export async function deleteTask(userId: string, id: string) {
  await getTaskForUser(userId, id)
  const now = new Date()

  const [row] = await db
    .update(tasks)
    .set({
      deletedAt: now,
      deletedById: userId,
    })
    .where(ownedTaskWhere(userId, id))
    .returning()

  if (!row) {
    throw notFoundError()
  }

  return row
}
