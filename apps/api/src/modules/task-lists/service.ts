import type { SortField } from '@repro-v2/api-types/contract'
import { db } from '@repro-v2/db'
import { and, desc, eq, isNull } from '@repro-v2/db/drizzle'
import { listWithOffset } from '@repro-v2/db/list'
import { taskLists, tasks } from '@repro-v2/db/schema/tasks'

import { internalServerError, notFoundError } from '@/libs/contract/errors'
import { serializeAuditTimestamps } from '@/libs/helpers/serialize-audit'
import { buildSortOrderBy } from '@/libs/queries/sort-order'

function toResponse(row: typeof taskLists.$inferSelect) {
  return {
    id: row.id,
    name: row.name,
    ...serializeAuditTimestamps(row),
  }
}

function ownedTaskListWhere(userId: string, workspaceId: string, id?: string) {
  const conditions = [
    eq(taskLists.userId, userId),
    eq(taskLists.workspaceId, workspaceId),
    isNull(taskLists.deletedAt),
  ]

  if (id) {
    conditions.push(eq(taskLists.id, id))
  }

  return and(...conditions)
}

async function list(
  userId: string,
  workspaceId: string,
  page: number,
  pageSize: number,
  sort: SortField[] = [],
) {
  return await listWithOffset<typeof taskLists.$inferSelect>({
    db,
    table: taskLists,
    where: ownedTaskListWhere(userId, workspaceId),
    orderBy: buildSortOrderBy(
      sort,
      { name: taskLists.name },
      desc(taskLists.createdAt),
    ),
    page,
    pageSize,
  })
}

async function create(userId: string, workspaceId: string, name: string) {
  const [row] = await db
    .insert(taskLists)
    .values({
      name,
      userId,
      workspaceId,
      createdById: userId,
    })
    .returning()

  if (!row) {
    throw internalServerError()
  }

  return row
}

async function getForUser(userId: string, workspaceId: string, id: string) {
  const [row] = await db
    .select()
    .from(taskLists)
    .where(ownedTaskListWhere(userId, workspaceId, id))
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
  name: string,
) {
  await getForUser(userId, workspaceId, id)

  const [row] = await db
    .update(taskLists)
    .set({
      name,
      updatedById: userId,
    })
    .where(ownedTaskListWhere(userId, workspaceId, id))
    .returning()

  if (!row) {
    throw notFoundError()
  }

  return row
}

async function remove(userId: string, workspaceId: string, id: string) {
  await getForUser(userId, workspaceId, id)
  const now = new Date()

  return await db.transaction(async tx => {
    await tx
      .update(tasks)
      .set({
        deletedAt: now,
        deletedById: userId,
      })
      .where(
        and(
          eq(tasks.listId, id),
          eq(tasks.workspaceId, workspaceId),
          isNull(tasks.deletedAt),
        ),
      )

    const [row] = await tx
      .update(taskLists)
      .set({
        deletedAt: now,
        deletedById: userId,
      })
      .where(ownedTaskListWhere(userId, workspaceId, id))
      .returning()

    if (!row) {
      throw notFoundError()
    }

    return row
  })
}

export const taskListsService = {
  list,
  create,
  getForUser,
  update,
  delete: remove,
  toResponse,
}
