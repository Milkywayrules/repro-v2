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
import { errorHandler } from './plugin'
import { ok } from './response'

const pagination = {
  buildCursorPaginationMeta,
  buildOffsetPaginationMeta,
  defaultPage: paginationConstants.defaultPage,
  defaultPageSize: paginationConstants.defaultPageSize,
  maxPageSize: paginationConstants.maxPageSize,
  parseCursorPagination,
  parseFilters,
  parseOffsetPagination,
  parseSort,
  toSqlOffset,
}

export const http = {
  api,
  codes: errorCodes,
  error: createError,
  messages: errorMessages,
  ok,
  pagination,
  plugin: () => errorHandler,
  status: httpStatus,
}
