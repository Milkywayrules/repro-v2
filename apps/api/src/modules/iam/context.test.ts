import { afterEach, describe, expect, spyOn, test } from 'bun:test'

import { Elysia } from 'elysia'

import { iamSession } from './context'
import { iamService } from './service'

const skipPaths = [
  { path: '/health', route: '/health' },
  { path: '/ready', route: '/ready' },
  { path: '/', route: '/' },
  { path: '/openapi', route: '/openapi' },
  { path: '/openapi/json', route: '/openapi/*' },
  { path: '/api/auth/session', route: '/api/auth/**' },
  {
    path: '/api/v1/platform/iam-features',
    route: '/api/v1/platform/iam-features',
  },
] as const

describe('iamSession derive', () => {
  afterEach(() => {
    spyOn(iamService, 'getSession').mockRestore()
  })

  for (const { path, route } of skipPaths) {
    test(`skips getSession for ${route}`, async () => {
      const getSessionSpy = spyOn(iamService, 'getSession').mockResolvedValue(
        null,
      )
      const app = new Elysia().use(iamSession).all('*', () => 'ok')

      await app.handle(new Request(`http://localhost${path}`))

      expect(getSessionSpy).not.toHaveBeenCalled()
    })
  }

  test('resolves session for other paths', async () => {
    const getSessionSpy = spyOn(iamService, 'getSession').mockResolvedValue(
      null,
    )
    const app = new Elysia().use(iamSession).get('/api/v1/', () => 'v1')

    await app.handle(new Request('http://localhost/api/v1/'))

    expect(getSessionSpy).toHaveBeenCalledTimes(1)
  })
})
