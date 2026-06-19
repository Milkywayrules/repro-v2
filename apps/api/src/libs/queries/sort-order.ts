import { asc, type Column, desc, type SQL } from '@repro-v2/db/drizzle'

import type { SortField } from '@/libs/contract/meta'

export function buildSortOrderBy(
  sort: SortField[],
  fieldMap: Record<string, Column>,
  defaultOrder: SQL | SQL[],
): SQL | SQL[] {
  const clauses: SQL[] = []

  for (const { field, direction } of sort) {
    const column = fieldMap[field]
    if (!column) {
      continue
    }

    clauses.push(direction === 'asc' ? asc(column) : desc(column))
  }

  return clauses.length > 0 ? clauses : defaultOrder
}
