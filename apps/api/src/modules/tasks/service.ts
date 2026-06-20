import type { SortField } from '@repro-v2/api-types/contract'
import { db } from '@repro-v2/db'
import { and, desc, eq, inArray, isNull } from '@repro-v2/db/drizzle'
import { listWithOffset } from '@repro-v2/db/list'
import { taskLists, tasks } from '@repro-v2/db/schema/tasks'

import { internalServerError, notFoundError } from '@/libs/contract/errors'
import { serializeAuditTimestamps } from '@/libs/helpers/serialize-audit'
import { buildSortOrderBy } from '@/libs/queries/sort-order'
import { taskListsService } from '@/modules/task-lists/service'

function toResponse(row: {
  id: string
  listId: string
  title: string
  completed: boolean
  createdAt: Date
  updatedAt: Date
  deletedAt: Date | null
}) {
  return {
    id: row.id,
    listId: row.listId,
    title: row.title,
    completed: row.completed,
    ...serializeAuditTimestamps(row),
  }
}

function ownedListIdsSubquery(userId: string, workspaceId: string) {
  return db
    .select({ id: taskLists.id })
    .from(taskLists)
    .where(
      and(
        eq(taskLists.userId, userId),
        eq(taskLists.workspaceId, workspaceId),
        isNull(taskLists.deletedAt),
      ),
    )
}

function ownedTaskWhere(userId: string, workspaceId: string, taskId: string) {
  return and(
    eq(tasks.id, taskId),
    eq(tasks.workspaceId, workspaceId),
    isNull(tasks.deletedAt),
    inArray(tasks.listId, ownedListIdsSubquery(userId, workspaceId)),
  )
}

function tasksListWhere(userId: string, workspaceId: string, listId?: string) {
  const conditions = [
    eq(tasks.workspaceId, workspaceId),
    isNull(tasks.deletedAt),
    inArray(tasks.listId, ownedListIdsSubquery(userId, workspaceId)),
  ]

  if (listId) {
    conditions.unshift(eq(tasks.listId, listId))
  }

  return and(...conditions)
}

async function list(
  userId: string,
  workspaceId: string,
  page: number,
  pageSize: number,
  listId?: string,
  sort: SortField[] = [],
) {
  if (listId) {
    await taskListsService.getForUser(userId, workspaceId, listId)
  }

  return await listWithOffset<typeof tasks.$inferSelect>({
    db,
    table: tasks,
    where: tasksListWhere(userId, workspaceId, listId),
    orderBy: buildSortOrderBy(
      sort,
      { title: tasks.title },
      desc(tasks.createdAt),
    ),
    page,
    pageSize,
  })
}

async function create(
  userId: string,
  workspaceId: string,
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
          eq(taskLists.workspaceId, workspaceId),
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
        workspaceId,
        createdById: userId,
      })
      .returning()

    if (!row) {
      throw internalServerError()
    }

    return row
  })
}

async function getForUser(userId: string, workspaceId: string, id: string) {
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
        eq(tasks.workspaceId, workspaceId),
        eq(taskLists.userId, userId),
        eq(taskLists.workspaceId, workspaceId),
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

async function update(
  userId: string,
  workspaceId: string,
  id: string,
  input: { title?: string; completed?: boolean },
) {
  await getForUser(userId, workspaceId, id)

  const [row] = await db
    .update(tasks)
    .set({
      ...(input.title === undefined ? {} : { title: input.title }),
      ...(input.completed === undefined ? {} : { completed: input.completed }),
      updatedById: userId,
    })
    .where(ownedTaskWhere(userId, workspaceId, id))
    .returning()

  if (!row) {
    throw notFoundError()
  }

  return row
}

async function remove(userId: string, workspaceId: string, id: string) {
  await getForUser(userId, workspaceId, id)
  const now = new Date()

  const [row] = await db
    .update(tasks)
    .set({
      deletedAt: now,
      deletedById: userId,
    })
    .where(ownedTaskWhere(userId, workspaceId, id))
    .returning()

  if (!row) {
    throw notFoundError()
  }

  return row
}

export const tasksService = {
  list,
  create,
  getForUser,
  update,
  delete: remove,
  toResponse,
}
