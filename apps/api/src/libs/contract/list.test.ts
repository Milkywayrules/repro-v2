import { describe, expect, test } from 'bun:test'

import { http } from './http'
import {
  buildCursorPaginationMeta,
  buildOffsetPaginationMeta,
  parseCursorPagination,
  parseFilters,
  parseOffsetPagination,
  parseSort,
  toSqlOffset,
} from './list'

describe('toSqlOffset', () => {
  test('returns zero for the first page', () => {
    expect(toSqlOffset(1, 20)).toBe(0)
  })

  test('computes offset from one-indexed page and page size', () => {
    expect(toSqlOffset(3, 10)).toBe(20)
  })
})

describe('buildOffsetPaginationMeta', () => {
  test('builds offset pagination meta with total pages', () => {
    expect(buildOffsetPaginationMeta(2, 20, 45)).toEqual({
      type: 'offset',
      page: 2,
      pageSize: 20,
      total: 45,
      totalPages: 3,
    })
  })

  test('returns zero total pages when page size is zero', () => {
    expect(buildOffsetPaginationMeta(1, 0, 10)).toEqual({
      type: 'offset',
      page: 1,
      pageSize: 0,
      total: 10,
      totalPages: 0,
    })
  })
})

describe('buildCursorPaginationMeta', () => {
  test('builds cursor pagination meta with type cursor', () => {
    expect(buildCursorPaginationMeta('abc123', 20, true, 'def456')).toEqual({
      type: 'cursor',
      cursor: 'abc123',
      limit: 20,
      hasMore: true,
      nextCursor: 'def456',
    })
  })

  test('omits nextCursor when not provided', () => {
    expect(buildCursorPaginationMeta(null, 20, false)).toEqual({
      type: 'cursor',
      cursor: null,
      limit: 20,
      hasMore: false,
    })
  })
})

describe('parseOffsetPagination', () => {
  test('applies defaults when params are missing', () => {
    expect(parseOffsetPagination(new URLSearchParams())).toEqual({
      page: http.pagination.defaults.page,
      pageSize: http.pagination.defaults.pageSize,
    })
  })

  test('parses page and pageSize from query string', () => {
    const params = new URLSearchParams({ page: '3', pageSize: '50' })

    expect(parseOffsetPagination(params)).toEqual({
      page: 3,
      pageSize: 50,
    })
  })

  test('rejects pageSize above maxPageSize', () => {
    const params = new URLSearchParams({
      pageSize: String(http.pagination.defaults.maxPageSize + 1),
    })

    expect(() => parseOffsetPagination(params)).toThrow()
  })

  test('rejects page below one', () => {
    const params = new URLSearchParams({ page: '0' })

    expect(() => parseOffsetPagination(params)).toThrow()
  })
})

describe('parseCursorPagination', () => {
  test('applies defaults when params are missing', () => {
    expect(parseCursorPagination(new URLSearchParams())).toEqual({
      cursor: undefined,
      limit: http.pagination.defaults.pageSize,
    })
  })

  test('parses cursor and limit from query string', () => {
    const params = new URLSearchParams({ cursor: 'abc123', limit: '25' })

    expect(parseCursorPagination(params)).toEqual({
      cursor: 'abc123',
      limit: 25,
    })
  })

  test('treats empty cursor as omitted', () => {
    const params = new URLSearchParams({ cursor: '' })

    expect(parseCursorPagination(params)).toEqual({
      cursor: undefined,
      limit: http.pagination.defaults.pageSize,
    })
  })
})

describe('parseSort', () => {
  test('returns empty array when sort param is missing', () => {
    expect(parseSort(new URLSearchParams())).toEqual([])
  })

  test('parses ascending, descending, and explicit ascending tokens', () => {
    const params = new URLSearchParams({ sort: 'name,-createdAt,+updatedAt' })

    expect(parseSort(params)).toEqual([
      { field: 'name', direction: 'asc' },
      { field: 'createdAt', direction: 'desc' },
      { field: 'updatedAt', direction: 'asc' },
    ])
  })

  test('filters to allowed fields when provided', () => {
    const params = new URLSearchParams({ sort: 'name,-createdAt,status' })

    expect(parseSort(params, ['name', 'status'])).toEqual([
      { field: 'name', direction: 'asc' },
      { field: 'status', direction: 'asc' },
    ])
  })

  test('skips empty and malformed tokens', () => {
    const params = new URLSearchParams({ sort: 'name,,-createdAt,+' })

    expect(parseSort(params)).toEqual([
      { field: 'name', direction: 'asc' },
      { field: 'createdAt', direction: 'desc' },
    ])
  })
})

describe('parseFilters', () => {
  test('returns empty object when no filter params are present', () => {
    expect(parseFilters(new URLSearchParams())).toEqual({})
  })

  test('collects repeated values and ignores reserved keys', () => {
    const params = new URLSearchParams()
    params.append('status', 'active')
    params.append('status', 'pending')
    params.set('page', '2')
    params.set('pageSize', '10')
    params.set('limit', '10')
    params.set('sort', 'name')

    expect(parseFilters(params)).toEqual({
      status: ['active', 'pending'],
    })
  })

  test('filters to allowed keys when provided', () => {
    const params = new URLSearchParams({ status: 'active', role: 'admin' })

    expect(parseFilters(params, ['status'])).toEqual({
      status: ['active'],
    })
  })

  test('trims and drops empty filter values', () => {
    const params = new URLSearchParams()
    params.append('status', ' active ')
    params.append('status', '   ')
    params.append('status', 'pending')

    expect(parseFilters(params)).toEqual({
      status: ['active', 'pending'],
    })
  })
})

describe('http.pagination facade', () => {
  test('offset.parse delegates to parseOffsetPagination', () => {
    expect(http.pagination.offset.parse(new URLSearchParams())).toEqual({
      page: http.pagination.defaults.page,
      pageSize: http.pagination.defaults.pageSize,
    })
  })

  test('cursor.parse delegates to parseCursorPagination', () => {
    expect(http.pagination.cursor.parse(new URLSearchParams())).toEqual({
      cursor: undefined,
      limit: http.pagination.defaults.pageSize,
    })
  })
})
