import { count, type SQL } from 'drizzle-orm'
import type { AnyPgTable } from 'drizzle-orm/pg-core'

import type { createDb } from './index'

type Db = ReturnType<typeof createDb>

export async function listWithOffset<T extends Record<string, unknown>>({
  db,
  table,
  where,
  orderBy,
  page,
  pageSize,
}: {
  db: Db
  table: AnyPgTable
  where?: SQL
  orderBy?: SQL | SQL[]
  page: number
  pageSize: number
}): Promise<{ rows: T[]; total: number }> {
  const offset = (page - 1) * pageSize

  const listQuery = db
    .select()
    .from(table)
    .where(where)
    .limit(pageSize)
    .offset(offset)
  const orderedListQuery = orderBy
    ? listQuery.orderBy(...(Array.isArray(orderBy) ? orderBy : [orderBy]))
    : listQuery

  const [rows, countRows] = await Promise.all([
    orderedListQuery,
    db.select({ total: count() }).from(table).where(where),
  ])

  return {
    rows: rows as T[],
    total: Number(countRows[0]?.total ?? 0),
  }
}
