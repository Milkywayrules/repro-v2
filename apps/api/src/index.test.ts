import { Elysia } from 'elysia'

import { errorHandler } from './http/errors'
import { ok } from './http/response'
import { describe, expect, test } from 'bun:test'

const app = new Elysia().use(errorHandler).get('/', () => ok({ status: 'ok' }))

describe('GET /', () => {
  test('returns success envelope', async () => {
    const response = await app.handle(new Request('http://localhost/'))

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({
      data: { status: 'ok' },
    })
  })
})
