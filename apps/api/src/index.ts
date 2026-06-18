import { cors } from '@elysiajs/cors'
import { auth } from '@repro-v2/auth'
import { env } from '@repro-v2/env/api'
import { Elysia } from 'elysia'
import { initLogger, log } from 'evlog'
import {
  type BetterAuthInstance,
  createAuthMiddleware,
} from 'evlog/better-auth'
import { evlog } from 'evlog/elysia'

import { http } from './contract/http'
import { requestId } from './contract/request-id'
import { healthRoutes } from './health'
import { registerGracefulShutdown } from './lifecycle'
import { authRateLimit, globalRateLimit } from './rate-limit'

initLogger({
  env: { service: 'repro-v2-api' },
})

const identifyUser = createAuthMiddleware(auth as BetterAuthInstance, {
  exclude: ['/api/auth/**', '/health', '/ready'],
  maskEmail: true,
})

// Plugin order: probes → request-id → logging → errors → rate limit → auth context → CORS → routes.
// CORS onRequest runs before handlers; error responses use set.status so headers apply.
export function createApp() {
  return (
    new Elysia()
      .use(healthRoutes)
      .use(requestId)
      .use(evlog({ exclude: ['/health', '/ready'] }))
      .use(http.plugin())
      .use(globalRateLimit)
      .derive(async ({ request, log }) => {
        await identifyUser(log, request.headers, new URL(request.url).pathname)
        return {}
      })
      .use(
        cors({
          origin: env.CORS_ORIGIN,
          methods: ['GET', 'POST', 'OPTIONS', 'PATCH', 'DELETE'],
          allowedHeaders: ['Content-Type', 'Authorization'],
          credentials: true,
        }),
      )
      // better-auth owns its own response shape; only non-POST/GET methods use our envelope.
      .group('/api/auth', app =>
        app.use(authRateLimit).all('/*', async context => {
          const { request } = context
          if (['POST', 'GET'].includes(request.method)) {
            return await auth.handler(request)
          }
          throw http.error({
            code: http.codes.METHOD_NOT_ALLOWED,
            message: http.messages.METHOD_NOT_ALLOWED,
            status: http.status.METHOD_NOT_ALLOWED,
          })
        }),
      )
      .group('/api/v1', app =>
        app.get('/', () =>
          http.ok({ status: 'ok' }, { apiVersion: http.api.VERSION }),
        ),
      )
      .get('/', () => http.ok({ status: 'ok' }))
  )
}

if (import.meta.main) {
  const app = createApp()

  const port = Number(process.env.PORT) || 5000

  app.listen(port, () => {
    log.info({ action: 'server.listen', port })
  })

  registerGracefulShutdown(app)
}
