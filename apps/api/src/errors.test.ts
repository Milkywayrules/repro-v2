import { describe, expect, test } from 'bun:test'

import { Elysia } from 'elysia'
import { z } from 'zod'

import { http } from './libs/contract'
import { errorHandler } from './libs/contract/plugin'
import { RateLimitExceededError, resolveError } from './libs/contract/resolve'
import { fail } from './libs/contract/response'

const jsonContentTypePattern = /^application\/json/

const app = new Elysia()
  .use(errorHandler)
  .get('/app-error', () => {
    throw http.error({
      code: 'ITEM_NOT_FOUND',
      message: 'Item not found',
      status: 404,
      why: 'The requested item does not exist',
    })
  })
  .get('/server-error', () => {
    throw http.error({
      code: 'DB_FAILURE',
      message: 'Connection pool exhausted',
      status: 503,
      why: 'All connections are in use',
    })
  })
  .get('/unexpected', () => {
    throw new Error('Something broke')
  })
  .post('/validate', ({ body }) => body, {
    body: z.object({
      name: z.string(),
    }),
  })
  .post('/parse', ({ body }) => body)

describe('resolveError', () => {
  test('redacts EvlogError messages for 5xx in production', () => {
    const error = http.error({
      code: 'DB_FAILURE',
      message: 'Connection pool exhausted',
      status: 503,
      why: 'All connections are in use',
    })

    const resolved = resolveError('UNKNOWN', error, { isProduction: true })

    expect(resolved.status).toBe(http.status.SERVICE_UNAVAILABLE)
    expect(resolved.body).toEqual({
      error: {
        code: http.codes.INTERNAL_SERVER_ERROR,
        message: http.messages.INTERNAL_SERVER_ERROR,
      },
    })
  })

  test('preserves EvlogError details for sub-500 in production', () => {
    const error = http.error({
      code: 'ITEM_NOT_FOUND',
      message: 'Item not found',
      status: 404,
      why: 'Missing item',
    })

    const resolved = resolveError('UNKNOWN', error, { isProduction: true })

    expect(resolved.body).toEqual({
      error: {
        code: 'ITEM_NOT_FOUND',
        message: 'Item not found',
        why: 'Missing item',
      },
    })
  })

  test('uses generic NOT_FOUND message in production', () => {
    const resolved = resolveError(
      'NOT_FOUND',
      new Error('Custom route missing'),
      { isProduction: true },
    )

    expect(resolved.body).toEqual({
      error: {
        code: http.codes.NOT_FOUND,
        message: http.messages.NOT_FOUND,
      },
    })
  })

  test('strips validation details in production', async () => {
    const validationApp = new Elysia()
      .onError({ as: 'global' }, ({ code, error, status }) => {
        const { status: statusCode, body } = resolveError(code, error, {
          isProduction: true,
        })

        return status(statusCode, body)
      })
      .post('/validate', ({ body }) => body, {
        body: z.object({ name: z.string() }),
      })

    const response = await validationApp.handle(
      new Request('http://localhost/validate', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({}),
      }),
    )

    const body = (await response.json()) as {
      error: { details?: unknown }
    }
    expect(body.error.details).toBeUndefined()
  })

  test('maps PARSE to a structured 400 response', () => {
    const resolved = resolveError('PARSE', new Error('Unexpected token'))

    expect(resolved.status).toBe(http.status.BAD_REQUEST)
    expect(resolved.body).toEqual({
      error: {
        code: http.codes.PARSE_ERROR,
        message: http.messages.PARSE_ERROR,
      },
    })
  })

  test('maps INVALID_COOKIE_SIGNATURE to a structured 401 response', () => {
    const resolved = resolveError(
      'INVALID_COOKIE_SIGNATURE',
      new Error('bad cookie'),
    )

    expect(resolved.status).toBe(http.status.UNAUTHORIZED)
    expect(resolved.body).toEqual({
      error: {
        code: http.codes.INVALID_COOKIE,
        message: http.messages.INVALID_COOKIE,
      },
    })
  })

  test('falls through non-ValidationError VALIDATION codes to 500', () => {
    const resolved = resolveError(
      'VALIDATION',
      new Error('not a validation error'),
    )

    expect(resolved.status).toBe(http.status.INTERNAL_SERVER_ERROR)
    expect(resolved.body.error.code).toBe(http.codes.INTERNAL_SERVER_ERROR)
  })

  test('maps RateLimitExceededError to structured 429 JSON', () => {
    const resolved = resolveError('UNKNOWN', new RateLimitExceededError())

    expect(resolved.status).toBe(http.status.TOO_MANY_REQUESTS)
    expect(resolved.body).toEqual(
      fail({
        code: http.codes.RATE_LIMIT_EXCEEDED,
        message: http.messages.RATE_LIMIT_EXCEEDED,
      }),
    )
  })
})

describe('error handler', () => {
  test('returns structured JSON for application errors', async () => {
    const response = await app.handle(new Request('http://localhost/app-error'))

    expect(response.status).toBe(http.status.NOT_FOUND)
    expect(await response.json()).toEqual({
      error: {
        code: 'ITEM_NOT_FOUND',
        message: 'Item not found',
        why: 'The requested item does not exist',
      },
    })
  })

  test('returns friendly NOT_FOUND for unknown routes', async () => {
    const response = await app.handle(
      new Request('http://localhost/does-not-exist'),
    )

    expect(response.status).toBe(http.status.NOT_FOUND)
    expect(await response.json()).toEqual({
      error: {
        code: http.codes.NOT_FOUND,
        message: http.messages.NOT_FOUND,
      },
    })
  })

  test('returns validation errors with details', async () => {
    const response = await app.handle(
      new Request('http://localhost/validate', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({}),
      }),
    )

    expect(response.status).toBe(http.status.UNPROCESSABLE_ENTITY)

    const body = (await response.json()) as {
      error: {
        code: string
        message: string
        details?: unknown[]
      }
    }
    expect(body.error.code).toBe(http.codes.VALIDATION_ERROR)
    expect(body.error.message).toBeString()
    expect(body.error.details).toBeArray()
  })

  test('returns parse errors for invalid JSON bodies', async () => {
    const response = await app.handle(
      new Request('http://localhost/parse', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: '{',
      }),
    )

    expect(response.status).toBe(http.status.BAD_REQUEST)
    expect(await response.json()).toEqual({
      error: {
        code: http.codes.PARSE_ERROR,
        message: http.messages.PARSE_ERROR,
      },
    })
  })

  test('returns internal server error for unexpected failures', async () => {
    const response = await app.handle(
      new Request('http://localhost/unexpected'),
    )

    expect(response.status).toBe(http.status.INTERNAL_SERVER_ERROR)
    expect(await response.json()).toEqual({
      error: {
        code: http.codes.INTERNAL_SERVER_ERROR,
        message: 'Something broke',
      },
    })
  })

  test('exposes server error details for EvlogError 5xx outside production', async () => {
    const response = await app.handle(
      new Request('http://localhost/server-error'),
    )

    expect(response.status).toBe(http.status.SERVICE_UNAVAILABLE)
    expect(await response.json()).toEqual({
      error: {
        code: 'DB_FAILURE',
        message: 'Connection pool exhausted',
        why: 'All connections are in use',
      },
    })
  })

  test('returns rate limit errors with JSON content type', async () => {
    const rateLimitedApp = new Elysia()
      .use(errorHandler)
      .get('/limited', () => {
        throw new RateLimitExceededError()
      })

    const response = await rateLimitedApp.handle(
      new Request('http://localhost/limited'),
    )

    expect(response.status).toBe(http.status.TOO_MANY_REQUESTS)
    expect(response.headers.get('content-type')).toMatch(jsonContentTypePattern)
    expect(await response.json()).toEqual(
      fail({
        code: http.codes.RATE_LIMIT_EXCEEDED,
        message: http.messages.RATE_LIMIT_EXCEEDED,
      }),
    )
  })
})
