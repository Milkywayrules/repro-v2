import { describe, expect, mock, spyOn, test } from 'bun:test'

import { env } from '@repro-v2/env/api'

import { http } from './libs/contract'

const requestIdHeader = 'X-Request-Id'
const jsonContentTypePattern = /^application\/json/

describe('full app wiring', () => {
  test('GET /ready includes CORS headers for configured browser origins', async () => {
    const { createApp } = await import('./app')
    const app = createApp()

    const response = await app.handle(
      new Request('http://localhost/ready', {
        headers: { Origin: env.CORS_ORIGIN[0] },
      }),
    )

    expect(response.status).toBe(http.status.OK)
    expect(response.headers.get('access-control-allow-origin')).toBe(
      env.CORS_ORIGIN[0],
    )
    expect(response.headers.get('access-control-allow-credentials')).toBe(
      'true',
    )
  })

  test('GET / returns success envelope with X-Request-Id', async () => {
    const { createApp } = await import('./app')
    const app = createApp()

    const response = await app.handle(new Request('http://localhost/'))

    expect(response.status).toBe(http.status.OK)
    expect(response.headers.get(requestIdHeader)).toBeString()
    expect(await response.json()).toEqual({
      data: { status: 'ok' },
    })
  })

  test('GET /api/v1/ requires authentication', async () => {
    const { createApp } = await import('./app')
    const app = createApp()

    const response = await app.handle(new Request('http://localhost/api/v1/'))

    expect(response.status).toBe(http.status.UNAUTHORIZED)
    expect(await response.json()).toEqual({
      error: {
        code: http.codes.UNAUTHORIZED,
        message: http.messages.UNAUTHORIZED,
      },
    })
  })

  test('GET /openapi/json documents v1 task routes', async () => {
    const { createApp } = await import('./app')
    const app = createApp()

    const response = await app.handle(
      new Request('http://localhost/openapi/json'),
    )

    expect(response.status).toBe(http.status.OK)
    const spec = (await response.json()) as {
      paths: Record<string, unknown>
      components?: {
        securitySchemes?: Record<string, unknown>
      }
      security?: unknown[]
    }
    expect(spec.paths).toHaveProperty('/api/v1/task-lists/')
    expect(spec.paths).toHaveProperty('/api/v1/tasks/')
    expect(spec.paths).toHaveProperty('/api/v1/platform/iam-features/')
    expect(spec.paths).not.toHaveProperty('/health')
    expect(spec.paths).not.toHaveProperty('/ready')
    expect(spec.components?.securitySchemes).toHaveProperty('sessionCookie')
    expect(spec.security).toEqual([{ sessionCookie: [] }])
  })

  test('GET /openapi/ HTML references absolute OpenAPI spec URL', async () => {
    const { createApp } = await import('./app')
    const app = createApp()

    const response = await app.handle(new Request('http://localhost/openapi/'))

    expect(response.status).toBe(http.status.OK)
    const html = await response.text()
    expect(html).toContain('"/openapi/json"')
    expect(html).not.toContain('"/openapi/openapi/json"')
  })

  test('openapi is disabled in production when OPENAPI_ENABLED is false', async () => {
    mock.module('@repro-v2/env/api', () => ({
      env: {
        ...env,
        NODE_ENV: 'production' as const,
        OPENAPI_ENABLED: false,
      },
    }))

    try {
      const { createApp: createProductionApp } = await import('./app')
      const app = createProductionApp()

      const response = await app.handle(
        new Request('http://localhost/openapi/json'),
      )

      expect(response.status).toBe(http.status.NOT_FOUND)
    } finally {
      mock.restore()
    }
  })

  test('unknown routes return 404 with X-Request-Id', async () => {
    const generatedRequestId =
      '00000000-0000-4000-8000-000000000789' as `${string}-${string}-${string}-${string}-${string}`
    const randomUUIDSpy = spyOn(crypto, 'randomUUID').mockReturnValue(
      generatedRequestId,
    )

    try {
      const { createApp } = await import('./app')
      const app = createApp()

      const response = await app.handle(
        new Request('http://localhost/does-not-exist'),
      )

      expect(response.status).toBe(http.status.NOT_FOUND)
      expect(response.headers.get(requestIdHeader)).toBe(generatedRequestId)
    } finally {
      randomUUIDSpy.mockRestore()
    }
  })

  test('DELETE /api/auth/session returns 405 with X-Request-Id', async () => {
    const { createApp } = await import('./app')
    const app = createApp()

    const response = await app.handle(
      new Request('http://localhost/api/auth/session', {
        method: 'DELETE',
      }),
    )

    expect(response.status).toBe(http.status.METHOD_NOT_ALLOWED)
    expect(response.headers.get(requestIdHeader)).toBeString()
    expect(response.headers.get('content-type')).toMatch(jsonContentTypePattern)
    expect(await response.json()).toEqual({
      error: {
        code: http.codes.METHOD_NOT_ALLOWED,
        message: http.messages.METHOD_NOT_ALLOWED,
      },
    })
  })

  test('preserves incoming X-Request-Id on success responses', async () => {
    const { createApp } = await import('./app')
    const app = createApp()
    const incomingRequestId = 'incoming-request-id-123'

    const response = await app.handle(
      new Request('http://localhost/', {
        headers: { [requestIdHeader]: incomingRequestId },
      }),
    )

    expect(response.status).toBe(http.status.OK)
    expect(response.headers.get(requestIdHeader)).toBe(incomingRequestId)
  })

  test('preserves incoming X-Request-Id on error responses', async () => {
    const { createApp } = await import('./app')
    const app = createApp()
    const incomingRequestId = 'incoming-request-id-456'

    const response = await app.handle(
      new Request('http://localhost/missing-route', {
        headers: { [requestIdHeader]: incomingRequestId },
      }),
    )

    expect(response.status).toBe(http.status.NOT_FOUND)
    expect(response.headers.get(requestIdHeader)).toBe(incomingRequestId)
  })

  test('returns 429 with X-Request-Id when global rate limit is exceeded', async () => {
    const { Elysia } = await import('elysia')
    const { rateLimit } = await import('elysia-rate-limit')
    const { http } = await import('./libs/contract')
    const { requestId } = await import('./libs/middleware')
    const { proxyAwareClientKey } = await import(
      './libs/middleware/client-address'
    )
    const { RateLimitExceededError } = await import('./libs/contract/resolve')

    const app = new Elysia()
      .use(requestId)
      .use(http.plugin())
      .use(
        rateLimit({
          duration: 60_000,
          max: 1,
          errorResponse: new RateLimitExceededError(),
          countFailedRequest: false,
          generator: proxyAwareClientKey,
        }),
      )
      .get('/', () => http.ok({ status: 'ok' }))

    await app.handle(new Request('http://localhost/'))

    const response = await app.handle(new Request('http://localhost/'))

    expect(response.status).toBe(http.status.TOO_MANY_REQUESTS)
    expect(response.headers.get(requestIdHeader)).toBeString()
    expect(await response.json()).toEqual({
      error: {
        code: http.codes.RATE_LIMIT_EXCEEDED,
        message: http.messages.RATE_LIMIT_EXCEEDED,
      },
    })
  })
})
