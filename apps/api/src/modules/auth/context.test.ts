import { afterEach, describe, expect, spyOn, test } from 'bun:test'

import { Elysia } from 'elysia'

import { authSession } from './context'
import { authService } from './service'

const skipPaths = [
  { path: '/health', route: '/health' },
  { path: '/ready', route: '/ready' },
  { path: '/', route: '/' },
  { path: '/openapi', route: '/openapi' },
  { path: '/openapi/json', route: '/openapi/*' },
  { path: '/api/auth/session', route: '/api/auth/**' },
] as const

describe('authSession derive', () => {
  afterEach(() => {
    spyOn(authService, 'getSession').mockRestore()
  })

  for (const { path, route } of skipPaths) {
    test(`skips getSession for ${route}`, async () => {
      const getSessionSpy = spyOn(authService, 'getSession').mockResolvedValue(
        null,
      )
      const app = new Elysia().use(authSession).all('*', () => 'ok')

      await app.handle(new Request(`http://localhost${path}`))

      expect(getSessionSpy).not.toHaveBeenCalled()
    })
  }

  test('resolves session for other paths', async () => {
    const getSessionSpy = spyOn(authService, 'getSession').mockResolvedValue(
      null,
    )
    const app = new Elysia().use(authSession).get('/api/v1/', () => 'v1')

    await app.handle(new Request('http://localhost/api/v1/'))

    expect(getSessionSpy).toHaveBeenCalledTimes(1)
  })
})
