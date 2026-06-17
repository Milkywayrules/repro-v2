import { checkDatabaseConnection } from '@repro-v2/db'
import { Elysia } from 'elysia'

import { isDraining } from './lifecycle'

const probeHeaders = {
  'Cache-Control': 'no-store, no-cache, must-revalidate',
} as const

export const healthRoutes = new Elysia()
  .get('/health', ({ set }) => {
    set.headers = probeHeaders
    return { status: 'ok' as const }
  })
  .get('/ready', async ({ set }) => {
    if (isDraining()) {
      set.headers = probeHeaders
      set.status = 503

      return {
        status: 'not_ready' as const,
        checks: {
          server: {
            status: 'fail' as const,
            error: 'Server is shutting down',
          },
        },
      }
    }

    const databaseResult = await checkDatabaseConnection()
    const ready = databaseResult.ok

    set.headers = probeHeaders
    set.status = ready ? 200 : 503

    return {
      status: ready ? ('ready' as const) : ('not_ready' as const),
      checks: {
        database: ready
          ? { status: 'pass' as const }
          : {
              status: 'fail' as const,
              error: databaseResult.error,
            },
      },
    }
  })
