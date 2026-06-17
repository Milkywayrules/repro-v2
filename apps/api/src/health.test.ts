import { Elysia } from 'elysia'

import { healthRoutes } from './health'
import { describe, expect, test } from 'bun:test'

const probeApp = new Elysia().use(healthRoutes)

describe('health probes', () => {
  test('GET /health returns 200 with ok status', async () => {
    const response = await probeApp.handle(
      new Request('http://localhost/health'),
    )

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({ status: 'ok' })
    expect(response.headers.get('cache-control')).toBe(
      'no-store, no-cache, must-revalidate',
    )
  })

  test('GET /ready returns 200 when database is reachable', async () => {
    const response = await probeApp.handle(
      new Request('http://localhost/ready'),
    )

    expect(response.status).toBe(200)

    const body = await response.json()
    expect(body).toEqual({
      status: 'ready',
      checks: {
        database: { status: 'pass' },
      },
    })
  })
})
