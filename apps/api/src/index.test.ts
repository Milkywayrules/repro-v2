import { describe, expect, test } from 'bun:test'

import { Elysia } from 'elysia'

import { http } from './libs/contract'
import { errorHandler } from './libs/contract/plugin'

const app = new Elysia()
  .use(errorHandler)
  .get('/', () => http.ok({ status: 'ok' }))

describe('GET /', () => {
  test('returns success envelope', async () => {
    const response = await app.handle(new Request('http://localhost/'))

    expect(response.status).toBe(http.status.OK)
    expect(await response.json()).toEqual({
      data: { status: 'ok' },
    })
  })
})
