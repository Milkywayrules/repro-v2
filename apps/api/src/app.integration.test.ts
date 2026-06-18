import { describe, expect, spyOn, test } from 'bun:test'

import { errorCodes, errorMessages } from './contract/constants'
import { http } from './contract/http'

const requestIdHeader = 'X-Request-Id'
const jsonContentTypePattern = /^application\/json/

describe('full app wiring', () => {
  test('GET / returns success envelope with X-Request-Id', async () => {
    const { createApp } = await import('./index')
    const app = createApp()

    const response = await app.handle(new Request('http://localhost/'))

    expect(response.status).toBe(200)
    expect(response.headers.get(requestIdHeader)).toBeString()
    expect(await response.json()).toEqual({
      data: { status: 'ok' },
    })
  })

  test('GET /api/v1/ includes apiVersion meta', async () => {
    const { createApp } = await import('./index')
    const app = createApp()

    const response = await app.handle(new Request('http://localhost/api/v1/'))

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({
      data: { status: 'ok' },
      meta: { apiVersion: http.api.VERSION },
    })
  })

  test('unknown routes return 404 with X-Request-Id', async () => {
    const { createApp } = await import('./index')
    const app = createApp()

    const response = await app.handle(
      new Request('http://localhost/does-not-exist'),
    )

    expect(response.status).toBe(404)
    expect(response.headers.get(requestIdHeader)).toBeString()
    expect(await response.json()).toEqual({
      error: {
        code: errorCodes.NOT_FOUND,
        message: errorMessages.NOT_FOUND,
      },
    })
  })

  test('uses same generated X-Request-Id on 404 without incoming header', async () => {
    const generatedRequestId =
      '00000000-0000-4000-8000-000000000789' as `${string}-${string}-${string}-${string}-${string}`
    const randomUUIDSpy = spyOn(crypto, 'randomUUID').mockReturnValue(
      generatedRequestId,
    )

    try {
      const { createApp } = await import('./index')
      const app = createApp()

      const response = await app.handle(
        new Request('http://localhost/does-not-exist'),
      )

      expect(response.status).toBe(404)
      expect(response.headers.get(requestIdHeader)).toBe(generatedRequestId)
    } finally {
      randomUUIDSpy.mockRestore()
    }
  })

  test('DELETE /api/auth/session returns 405 with X-Request-Id', async () => {
    const { createApp } = await import('./index')
    const app = createApp()

    const response = await app.handle(
      new Request('http://localhost/api/auth/session', {
        method: 'DELETE',
      }),
    )

    expect(response.status).toBe(405)
    expect(response.headers.get(requestIdHeader)).toBeString()
    expect(response.headers.get('content-type')).toMatch(jsonContentTypePattern)
    expect(await response.json()).toEqual({
      error: {
        code: errorCodes.METHOD_NOT_ALLOWED,
        message: errorMessages.METHOD_NOT_ALLOWED,
      },
    })
  })

  test('preserves incoming X-Request-Id on success responses', async () => {
    const { createApp } = await import('./index')
    const app = createApp()
    const incomingRequestId = 'incoming-request-id-123'

    const response = await app.handle(
      new Request('http://localhost/', {
        headers: { [requestIdHeader]: incomingRequestId },
      }),
    )

    expect(response.status).toBe(200)
    expect(response.headers.get(requestIdHeader)).toBe(incomingRequestId)
  })

  test('preserves incoming X-Request-Id on error responses', async () => {
    const { createApp } = await import('./index')
    const app = createApp()
    const incomingRequestId = 'incoming-request-id-456'

    const response = await app.handle(
      new Request('http://localhost/missing-route', {
        headers: { [requestIdHeader]: incomingRequestId },
      }),
    )

    expect(response.status).toBe(404)
    expect(response.headers.get(requestIdHeader)).toBe(incomingRequestId)
  })

  test('returns 429 with X-Request-Id when global rate limit is exceeded', async () => {
    const { Elysia } = await import('elysia')
    const { rateLimit } = await import('elysia-rate-limit')
    const { requestId } = await import('./contract/request-id')
    const { http } = await import('./contract/http')
    const { RateLimitExceededError } = await import('./contract/resolve')

    const app = new Elysia()
      .use(requestId)
      .use(http.plugin())
      .use(
        rateLimit({
          duration: 60_000,
          max: 1,
          errorResponse: new RateLimitExceededError(),
          countFailedRequest: false,
        }),
      )
      .get('/', () => http.ok({ status: 'ok' }))

    await app.handle(new Request('http://localhost/'))

    const response = await app.handle(new Request('http://localhost/'))

    expect(response.status).toBe(429)
    expect(response.headers.get(requestIdHeader)).toBeString()
    expect(await response.json()).toEqual({
      error: {
        code: errorCodes.RATE_LIMIT_EXCEEDED,
        message: errorMessages.RATE_LIMIT_EXCEEDED,
      },
    })
  })
})
