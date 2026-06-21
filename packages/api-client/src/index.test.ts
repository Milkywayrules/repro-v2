import { describe, expect, test } from 'bun:test'

import {
  createApiClient,
  formatTreatyError,
  isTreatyUnauthorized,
  taskListsApi,
  tasksApi,
} from './index'

describe('createApiClient', () => {
  test('returns treaty client with api namespace', () => {
    const client = createApiClient('http://localhost:5000')

    expect(client.api).toBeDefined()
    expect(client.api.v1).toBeDefined()
    expect(tasksApi(client)).toBeDefined()
    expect(taskListsApi(client)).toBeDefined()
  })

  test('exposes platform probe routes', () => {
    const client = createApiClient('http://localhost:5000')

    expect(client.get).toBeDefined()
    expect(client.health).toBeDefined()
    expect(client.ready).toBeDefined()
  })
})

describe('formatTreatyError', () => {
  test('returns envelope message from treaty value wrapper', () => {
    const error = {
      value: {
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Name is required',
        },
      },
    }

    expect(formatTreatyError(error, 'Fallback')).toBe('Name is required')
  })

  test('uses fallback for unknown error shape', () => {
    expect(formatTreatyError(null, 'Fallback')).toBe('Fallback')
  })
})

describe('isTreatyUnauthorized', () => {
  test('detects unauthorized from treaty status', () => {
    expect(isTreatyUnauthorized({ status: 401 })).toBe(true)
  })

  test('returns false for other errors', () => {
    expect(
      isTreatyUnauthorized({
        value: {
          error: {
            code: 'NOT_FOUND',
            message: 'Not found',
          },
        },
      }),
    ).toBe(false)
  })
})
