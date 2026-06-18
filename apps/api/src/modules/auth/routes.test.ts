import { describe, expect, test } from 'bun:test'

import { Elysia } from 'elysia'

import { http } from '@/libs/contract'
import { authModuleRoutes } from '@/modules/auth/routes'

describe('auth module routes', () => {
  test('DELETE /api/auth/session returns 405 with envelope', async () => {
    const app = new Elysia()
      .use(http.plugin())
      .group('/api/auth', authApp => authApp.use(authModuleRoutes))

    const response = await app.handle(
      new Request('http://localhost/api/auth/session', {
        method: 'DELETE',
      }),
    )

    expect(response.status).toBe(http.status.METHOD_NOT_ALLOWED)
    expect(await response.json()).toEqual({
      error: {
        code: http.codes.METHOD_NOT_ALLOWED,
        message: http.messages.METHOD_NOT_ALLOWED,
      },
    })
  })
})
