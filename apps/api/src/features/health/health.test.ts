import { afterAll, describe, expect, mock, test } from 'bun:test'

import { env } from '@repro-v2/env/api'
import { Elysia } from 'elysia'

import { http } from '../../libs/contract'
import { healthRoutes } from './index'

const probeApp = new Elysia().use(healthRoutes)

describe('health probes', () => {
  test('GET /health returns 200 with ok status', async () => {
    const response = await probeApp.handle(
      new Request('http://localhost/health'),
    )

    expect(response.status).toBe(http.status.OK)
    expect(await response.json()).toEqual({ status: 'ok' })
    expect(response.headers.get('cache-control')).toBe(
      'no-store, no-cache, must-revalidate',
    )
  })

  test('GET /ready returns 200 when database is reachable', async () => {
    const response = await probeApp.handle(
      new Request('http://localhost/ready'),
    )

    expect(response.status).toBe(http.status.OK)

    const body = await response.json()
    expect(body).toEqual({
      status: 'ready',
      checks: {
        database: { status: 'pass' },
      },
    })
  })

  test('GET /ready sanitizes database errors in production', async () => {
    mock.module('@repro-v2/env/api', () => ({
      env: {
        ...env,
        NODE_ENV: 'production' as const,
      },
    }))
    mock.module('@repro-v2/db', () => ({
      checkDatabaseConnection: async () => ({
        ok: false as const,
        error: 'Connection refused: internal pool details',
      }),
    }))

    const { healthRoutes: productionHealthRoutes } = await import('./index')
    const productionProbeApp = new Elysia().use(productionHealthRoutes)

    const response = await productionProbeApp.handle(
      new Request('http://localhost/ready'),
    )

    expect(response.status).toBe(http.status.SERVICE_UNAVAILABLE)
    expect(await response.json()).toEqual({
      status: 'not_ready',
      checks: {
        database: {
          status: 'fail',
          error: http.messages.DATABASE_UNAVAILABLE,
        },
      },
    })

    mock.restore()
  })
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
