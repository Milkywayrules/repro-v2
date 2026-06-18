import { http } from '@/libs/contract'
import { safeParseOffsetPagination } from '@/libs/contract/list'
import type { SortField } from '@/libs/contract/meta'

export async function paginatedList<T>({
  searchParams,
  allowedFilterKeys,
  allowedSortFields,
  query,
}: {
  searchParams: URLSearchParams
  allowedFilterKeys?: readonly string[]
  allowedSortFields?: readonly string[]
  query: (input: {
    page: number
    pageSize: number
    filters: Record<string, string[]>
    sort: SortField[]
  }) => Promise<{ rows: T[]; total: number }>
}) {
  const parsed = safeParseOffsetPagination(searchParams)
  if (!parsed.success) {
    const first = parsed.error.issues[0]
    throw http.error({
      code: http.codes.VALIDATION_ERROR,
      message: first?.message ?? 'Invalid pagination parameters',
      status: http.status.UNPROCESSABLE_ENTITY,
    })
  }
  const { page, pageSize } = parsed.data
  const filters = allowedFilterKeys
    ? http.pagination.filters.parse(searchParams, allowedFilterKeys)
    : {}
  const sort = allowedSortFields
    ? http.pagination.sort.parse(searchParams, allowedSortFields)
    : []

  const { rows, total } = await query({ page, pageSize, filters, sort })

  return {
    rows,
    meta: {
      pagination: http.pagination.offset.buildMeta(page, pageSize, total),
      ...(allowedFilterKeys && Object.keys(filters).length > 0
        ? { filters }
        : {}),
      ...(sort.length > 0 ? { sort } : {}),
    },
  }
}
