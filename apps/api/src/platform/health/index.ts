import { checkDatabaseConnection } from '@repro-v2/db'
import { env } from '@repro-v2/env/api'
import { Elysia } from 'elysia'

import { http } from '@/libs/contract'
import { isDraining } from '@/lifecycle'

export const healthRoutes = new Elysia()
  .get('/health', () => ({ status: 'ok' as const }))
  .get('/ready', async ({ set }) => {
    if (isDraining()) {
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

    set.status = ready ? 200 : 503

    return {
      status: ready ? ('ready' as const) : ('not_ready' as const),
      checks: {
        database: ready
          ? { status: 'pass' as const }
          : {
              status: 'fail' as const,
              error:
                env.NODE_ENV === 'production'
                  ? http.messages.DATABASE_UNAVAILABLE
                  : databaseResult.error,
            },
      },
    }
  })
