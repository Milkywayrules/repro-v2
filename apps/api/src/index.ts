import { cors } from '@elysiajs/cors'
import { auth } from '@repro-v2/auth'
import { env } from '@repro-v2/env/api'
import { Elysia } from 'elysia'
import { initLogger } from 'evlog'
import {
  type BetterAuthInstance,
  createAuthMiddleware,
} from 'evlog/better-auth'
import { evlog } from 'evlog/elysia'

import { healthRoutes } from './health'
import { errorHandler, methodNotAllowedResponse } from './http/errors'
import { ok } from './http/response'
import { registerGracefulShutdown } from './lifecycle'
import { authRateLimit, globalRateLimit } from './rate-limit'

initLogger({
  env: { service: 'repro-v2-api' },
})

const identifyUser = createAuthMiddleware(auth as BetterAuthInstance, {
  exclude: ['/api/auth/**', '/health', '/ready'],
  maskEmail: true,
})

// Plugin order: probes → logging → errors → rate limit → auth context → CORS → routes.
// CORS onRequest runs before handlers; error responses use set.status so headers apply.
const app = new Elysia()
  .use(healthRoutes)
  .use(evlog({ exclude: ['/health', '/ready'] }))
  .use(errorHandler)
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
      const { request, status } = context
      if (['POST', 'GET'].includes(request.method)) {
        return await auth.handler(request)
      }
      return status(405, methodNotAllowedResponse())
    }),
  )
  .get('/', () => ok({ status: 'ok' }))
  .listen(Number(process.env.PORT) || 5000, () => {
    console.log(`Server is running on port ${process.env.PORT ?? 5000}`)
  })

registerGracefulShutdown(app)
