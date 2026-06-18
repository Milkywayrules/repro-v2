import { createError } from 'evlog'

import {
  api,
  errorCodes,
  errorMessages,
  httpStatus,
  pagination as paginationConstants,
} from './constants'
import {
  buildCursorPaginationMeta,
  buildOffsetPaginationMeta,
  parseCursorPagination,
  parseFilters,
  parseOffsetPagination,
  parseSort,
  toSqlOffset,
} from './list'
import type { ApiMeta } from './meta'
import { errorHandler } from './plugin'
import { ok } from './response'

function okV1<T>(data: T, meta?: ApiMeta) {
  return ok(data, { ...meta, apiVersion: api.VERSION })
}

const pagination = {
  defaults: {
    page: paginationConstants.defaultPage,
    pageSize: paginationConstants.defaultPageSize,
    maxPageSize: paginationConstants.maxPageSize,
  },
  offset: {
    parse: parseOffsetPagination,
    buildMeta: buildOffsetPaginationMeta,
    toSql: toSqlOffset,
  },
  cursor: {
    parse: parseCursorPagination,
    buildMeta: buildCursorPaginationMeta,
  },
  filters: {
    parse: parseFilters,
  },
  sort: {
    parse: parseSort,
  },
}

export const http = {
  api,
  codes: errorCodes,
  error: createError,
  messages: errorMessages,
  ok,
  okV1,
  pagination,
  plugin: () => errorHandler,
  status: httpStatus,
}
