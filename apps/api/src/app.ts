import { cors } from '@elysiajs/cors'
import { openapi } from '@elysiajs/openapi'
import { env } from '@repro-v2/env/api'
import { Elysia } from 'elysia'
import { initLogger } from 'evlog'
import { identifyUser as identifyUserForLog } from 'evlog/better-auth'
import { evlog } from 'evlog/elysia'
import { z } from 'zod'

import { http } from '@/libs/contract'
import { globalRateLimit, requestId } from '@/libs/middleware'
import { authSession } from '@/modules/auth/context'
import { shouldSkipAuthContext } from '@/modules/auth/paths'
import { authRoutes } from '@/routes/auth'
import { platformRoutes } from '@/routes/platform'
import { v1Routes } from '@/routes/v1'

initLogger({
  env: { service: 'repro-v2-api' },
})

function createOpenApiPlugin() {
  const openApiEnabled = env.NODE_ENV !== 'production' || env.OPENAPI_ENABLED

  return openapi({
    enabled: openApiEnabled,
    documentation: {
      info: {
        title: 'repro-v2 API',
        version: http.api.VERSION,
      },
      components: {
        securitySchemes: {
          sessionCookie: {
            type: 'apiKey',
            in: 'cookie',
            name: 'better-auth.session_token',
            description: 'Better Auth session cookie',
          },
        },
      },
      security: [{ sessionCookie: [] }],
    },
    exclude: {
      paths: ['/health', '/ready', '/api/auth/*'],
    },
    mapJsonSchema: {
      zod: z.toJSONSchema,
    },
    scalar: {
      // Absolute path — relative `openapi/json` resolves to /openapi/openapi/json from /openapi/
      url: '/openapi/json',
    },
  })
}

export function createApp() {
  return new Elysia()
    .use(platformRoutes)
    .use(requestId)
    .use(evlog({ exclude: ['/health', '/ready'] }))
    .use(http.plugin())
    .use(globalRateLimit)
    .use(authSession)
    .derive(({ request, log, authSession: session }) => {
      const pathname = new URL(request.url).pathname
      if (shouldSkipAuthContext(pathname)) {
        return {}
      }

      if (session) {
        identifyUserForLog(log, session, { maskEmail: true })
      }

      return {}
    })
    .use(
      cors({
        origin: env.CORS_ORIGIN,
        methods: ['GET', 'POST', 'OPTIONS', 'PATCH', 'DELETE'],
        allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
        exposeHeaders: ['X-Request-Id'],
        credentials: true,
      }),
    )
    .use(createOpenApiPlugin())
    .use(authRoutes)
    .use(v1Routes)
    .get('/', () => http.ok({ status: 'ok' }))
}

export type App = ReturnType<typeof createApp>
