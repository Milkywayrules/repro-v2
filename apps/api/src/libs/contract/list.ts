import { z } from 'zod'

import { pagination as paginationConstants } from './constants'
import type { CursorPagination, OffsetPagination, SortField } from './meta'

const RESERVED_QUERY_KEYS = new Set([
  'cursor',
  'limit',
  'page',
  'pageSize',
  'sort',
])

const offsetPaginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(paginationConstants.defaultPage),
  pageSize: z.coerce
    .number()
    .int()
    .min(1)
    .max(paginationConstants.maxPageSize)
    .default(paginationConstants.defaultPageSize),
})

const cursorPaginationSchema = z.object({
  cursor: z.string().min(1).optional(),
  limit: z.coerce
    .number()
    .int()
    .min(1)
    .max(paginationConstants.maxPageSize)
    .default(paginationConstants.defaultPageSize),
})

function readQueryValue(
  searchParams: URLSearchParams,
  key: string,
): string | undefined {
  const value = searchParams.get(key)
  return value === null || value === '' ? undefined : value
}

function readRepeatedQueryValues(
  searchParams: URLSearchParams,
  key: string,
): string[] {
  return searchParams
    .getAll(key)
    .map(value => value.trim())
    .filter(value => value.length > 0)
}

function parseSortToken(token: string): SortField | null {
  const trimmed = token.trim()
  if (trimmed.length === 0) {
    return null
  }

  if (trimmed.startsWith('-')) {
    const field = trimmed.slice(1).trim()
    return field.length > 0 ? { field, direction: 'desc' } : null
  }

  const field = trimmed.startsWith('+') ? trimmed.slice(1).trim() : trimmed
  return field.length > 0 ? { field, direction: 'asc' } : null
}

export function toSqlOffset(page: number, pageSize: number): number {
  return (page - 1) * pageSize
}

export function buildOffsetPaginationMeta(
  page: number,
  pageSize: number,
  total: number,
): OffsetPagination {
  return {
    type: 'offset',
    page,
    pageSize,
    total,
    totalPages: pageSize > 0 ? Math.ceil(total / pageSize) : 0,
  }
}

export function buildCursorPaginationMeta(
  cursor: string | null,
  limit: number,
  hasMore: boolean,
  nextCursor?: string | null,
): CursorPagination {
  return {
    type: 'cursor',
    cursor,
    limit,
    hasMore,
    ...(nextCursor === undefined ? {} : { nextCursor }),
  }
}

export function parseOffsetPagination(searchParams: URLSearchParams) {
  return offsetPaginationSchema.parse({
    page: readQueryValue(searchParams, 'page'),
    pageSize: readQueryValue(searchParams, 'pageSize'),
  })
}

export function safeParseOffsetPagination(searchParams: URLSearchParams) {
  return offsetPaginationSchema.safeParse({
    page: readQueryValue(searchParams, 'page'),
    pageSize: readQueryValue(searchParams, 'pageSize'),
  })
}

export function parseCursorPagination(searchParams: URLSearchParams) {
  return cursorPaginationSchema.parse({
    cursor: readQueryValue(searchParams, 'cursor'),
    limit: readQueryValue(searchParams, 'limit'),
  })
}

export function parseSort(
  searchParams: URLSearchParams,
  allowedFields?: readonly string[],
): SortField[] {
  const raw = readQueryValue(searchParams, 'sort')
  if (!raw) {
    return []
  }

  const allowed = allowedFields ? new Set(allowedFields) : null
  const fields: SortField[] = []

  for (const token of raw.split(',')) {
    const parsed = parseSortToken(token)
    if (!parsed) {
      continue
    }

    if (allowed && !allowed.has(parsed.field)) {
      continue
    }

    fields.push(parsed)
  }

  return fields
}

export function parseFilters(
  searchParams: URLSearchParams,
  allowedKeys?: readonly string[],
): Record<string, string[]> {
  const allowed = allowedKeys ? new Set(allowedKeys) : null
  const filters: Record<string, string[]> = {}

  for (const key of new Set(searchParams.keys())) {
    if (RESERVED_QUERY_KEYS.has(key)) {
      continue
    }

    if (allowed && !allowed.has(key)) {
      continue
    }

    const values = readRepeatedQueryValues(searchParams, key)
    if (values.length > 0) {
      filters[key] = values
    }
  }

  return filters
}
