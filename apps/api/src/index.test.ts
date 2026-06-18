import { describe, expect, test } from 'bun:test'

import { Elysia } from 'elysia'

import { http } from './contract/http'
import { errorHandler } from './contract/plugin'

const app = new Elysia()
  .use(errorHandler)
  .get('/', () => http.ok({ status: 'ok' }))

describe('GET /', () => {
  test('returns success envelope', async () => {
    const response = await app.handle(new Request('http://localhost/'))

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({
      data: { status: 'ok' },
    })
  })
})
