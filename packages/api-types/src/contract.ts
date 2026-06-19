import type { ErrorCode } from './constants'

export interface ApiMeta {
  apiVersion?: string
  filters?: Record<string, string[]>
  pagination?: OffsetPagination | CursorPagination
  sort?: SortField[]
  [key: string]: unknown
}

export interface SuccessEnvelope<T> {
  data: T
  meta?: ApiMeta
}

export interface ErrorBody {
  code: ErrorCode
  details?: unknown
  fix?: string
  link?: string
  message: string
  why?: string
}

export interface ErrorEnvelope {
  error: ErrorBody
}

export interface OffsetPagination {
  page: number
  pageSize: number
  total: number
  totalPages: number
  type: 'offset'
}

export interface CursorPagination {
  cursor: string | null
  hasMore: boolean
  limit: number
  nextCursor?: string | null
  type: 'cursor'
}

export interface SortField {
  direction: 'asc' | 'desc'
  field: string
}

export interface ListMeta extends ApiMeta {
  pagination: OffsetPagination | CursorPagination
}
