import { describe, expect, test } from 'bun:test'

import {
  errorCodes,
  errorMessages,
  httpStatus,
} from '@repro-v2/api-types/constants'

import {
  createApiClient,
  formatTreatyError,
  isTreatyUnauthorized,
} from './index'

describe('createApiClient', () => {
  test('returns treaty client with api namespace', () => {
    const client = createApiClient('http://localhost:5000')

    expect(client.api).toBeDefined()
    expect(client.api.v1).toBeDefined()
    expect(client.api.v1.tasks).toBeDefined()
    expect(client.api.v1['task-lists']).toBeDefined()
  })
})

describe('formatTreatyError', () => {
  test('returns envelope message from treaty value wrapper', () => {
    const error = {
      value: {
        error: {
          code: errorCodes.VALIDATION_ERROR,
          message: 'Name is required',
        },
      },
    }

    expect(formatTreatyError(error, 'Fallback')).toBe('Name is required')
  })

  test('returns envelope message from direct error envelope', () => {
    const error = {
      error: {
        code: errorCodes.NOT_FOUND,
        message: errorMessages.NOT_FOUND,
      },
    }

    expect(formatTreatyError(error, 'Fallback')).toBe('Resource not found')
  })

  test('uses fallback for empty envelope message', () => {
    const error = {
      value: {
        error: {
          code: errorCodes.INTERNAL_SERVER_ERROR,
          message: '   ',
        },
      },
    }

    expect(formatTreatyError(error, 'Something went wrong')).toBe(
      'Something went wrong',
    )
  })

  test('uses fallback for unknown error shape', () => {
    expect(formatTreatyError(null, 'Fallback')).toBe('Fallback')
    expect(formatTreatyError('network failure', 'Fallback')).toBe('Fallback')
  })
})

describe('isTreatyUnauthorized', () => {
  test('detects unauthorized from treaty status', () => {
    expect(isTreatyUnauthorized({ status: httpStatus.UNAUTHORIZED })).toBe(true)
  })

  test('detects unauthorized from envelope code in value wrapper', () => {
    const error = {
      status: httpStatus.UNAUTHORIZED,
      value: {
        error: {
          code: errorCodes.UNAUTHORIZED,
          message: errorMessages.UNAUTHORIZED,
        },
      },
    }

    expect(isTreatyUnauthorized(error)).toBe(true)
  })

  test('detects unauthorized from direct envelope', () => {
    const error = {
      error: {
        code: errorCodes.UNAUTHORIZED,
        message: errorMessages.UNAUTHORIZED,
      },
    }

    expect(isTreatyUnauthorized(error)).toBe(true)
  })

  test('returns false for other errors', () => {
    expect(
      isTreatyUnauthorized({
        value: {
          error: {
            code: errorCodes.NOT_FOUND,
            message: errorMessages.NOT_FOUND,
          },
        },
      }),
    ).toBe(false)
  })
})
