import { afterAll, beforeAll, describe, expect, mock, test } from 'bun:test'

import { cors } from '@elysiajs/cors'
import { env } from '@repro-v2/env/api'
import { Elysia } from 'elysia'
import { rateLimit } from 'elysia-rate-limit'
import { type DrainContext, initLogger } from 'evlog'
import { evlog } from 'evlog/elysia'

import { http } from './libs/contract'
import { errorHandler } from './libs/contract/plugin'
import { RateLimitExceededError } from './libs/contract/resolve'
import { requestId } from './libs/middleware'
import { proxyAwareClientKey } from './libs/middleware/client-address'

const jsonContentTypePattern = /^application\/json/

const drainedEvents: DrainContext[] = []

const captureDrain = (ctx: DrainContext | DrainContext[]) => {
  const events = Array.isArray(ctx) ? ctx : [ctx]
  drainedEvents.push(...events)
}

initLogger({
  env: { service: 'repro-v2-api-test' },
  drain: captureDrain,
  silent: true,
})

function createProductionErrorRoutes() {
  return new Elysia()
    .use(evlog({ drain: captureDrain }))
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
}

const app = new Elysia()
  .use(evlog({ drain: captureDrain }))
  .use(errorHandler)
  .get('/app-error', () => {
    throw http.error({
      code: 'ITEM_NOT_FOUND',
      message: 'Item not found',
      status: 404,
      why: 'The requested item does not exist',
    })
  })
  .get('/unexpected', () => {
    throw new Error('Something broke')
  })

describe('error handler with evlog', () => {
  beforeAll(() => {
    mock.module('@repro-v2/env/api', () => ({
      env: {
        ...env,
        NODE_ENV: 'development' as const,
      },
    }))
  })

  afterAll(() => {
    mock.restore()
  })

  test('returns structured JSON while evlog handles logging', async () => {
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
})

describe('production error handler with evlog', () => {
  let productionApp: ReturnType<typeof createProductionErrorRoutes>

  beforeAll(() => {
    mock.module('@repro-v2/env/api', () => ({
      env: {
        ...env,
        NODE_ENV: 'production' as const,
      },
    }))
    productionApp = createProductionErrorRoutes()
  })

  afterAll(() => {
    mock.restore()
    mock.module('@repro-v2/env/api', () => ({
      env: {
        ...env,
        NODE_ENV: 'development' as const,
      },
    }))
  })

  test('redacts EvlogError 5xx responses', async () => {
    const response = await productionApp.handle(
      new Request('http://localhost/server-error'),
    )

    expect(response.status).toBe(http.status.SERVICE_UNAVAILABLE)
    expect(await response.json()).toEqual({
      error: {
        code: http.codes.INTERNAL_SERVER_ERROR,
        message: http.messages.INTERNAL_SERVER_ERROR,
      },
    })
  })

  test('redacts unexpected 500 responses', async () => {
    const response = await productionApp.handle(
      new Request('http://localhost/unexpected'),
    )

    expect(response.status).toBe(http.status.INTERNAL_SERVER_ERROR)
    expect(await response.json()).toEqual({
      error: {
        code: http.codes.INTERNAL_SERVER_ERROR,
        message: http.messages.INTERNAL_SERVER_ERROR,
      },
    })
  })

  test('uses generic NOT_FOUND for unknown routes', async () => {
    const response = await productionApp.handle(
      new Request('http://localhost/missing'),
    )

    expect(response.status).toBe(http.status.NOT_FOUND)
    expect(await response.json()).toEqual({
      error: {
        code: http.codes.NOT_FOUND,
        message: http.messages.NOT_FOUND,
      },
    })
  })
})

describe('rate limit with evlog and cors', () => {
  const rateLimitExceededError = new RateLimitExceededError()
  const rateLimitedApp = new Elysia()
    .use(requestId)
    .use(evlog({ drain: captureDrain }))
    .use(errorHandler)
    .use(
      cors({
        origin: env.CORS_ORIGIN,
        methods: ['GET'],
        credentials: true,
      }),
    )
    .use(
      rateLimit({
        duration: 60_000,
        max: 1,
        errorResponse: rateLimitExceededError,
        countFailedRequest: false,
        generator: proxyAwareClientKey,
      }),
    )
    .get('/limited', () => 'ok')

  test('returns 429 with CORS headers and structured body', async () => {
    drainedEvents.length = 0

    const requestInit = {
      headers: {
        Origin: env.CORS_ORIGIN,
      },
    } as const

    await rateLimitedApp.handle(
      new Request('http://localhost/limited', requestInit),
    )

    const response = await rateLimitedApp.handle(
      new Request('http://localhost/limited', requestInit),
    )

    expect(response.status).toBe(http.status.TOO_MANY_REQUESTS)
    expect(response.headers.get('X-Request-Id')).toBeString()
    expect(response.headers.get('content-type')).toMatch(jsonContentTypePattern)
    expect(response.headers.get('access-control-allow-origin')).toBe(
      env.CORS_ORIGIN,
    )
    expect(await response.json()).toEqual({
      error: {
        code: http.codes.RATE_LIMIT_EXCEEDED,
        message: http.messages.RATE_LIMIT_EXCEEDED,
      },
    })

    const rateLimitDrain = drainedEvents.find(
      event => event.event.status === http.status.TOO_MANY_REQUESTS,
    )
    expect(rateLimitDrain?.event.status).toBe(http.status.TOO_MANY_REQUESTS)
  })
})
