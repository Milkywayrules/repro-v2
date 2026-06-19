import { Elysia } from 'elysia'

import { http } from '@/libs/contract'
import { unauthorizedError } from '@/libs/contract/errors'
import { authRateLimit } from '@/libs/middleware'

import { auth } from './auth'
import { authSession } from './context'

export const requireAuth = new Elysia({ name: 'require-auth' })
  .use(authSession)
  .resolve({ as: 'scoped' }, ({ authSession: session }) => {
    if (!session) {
      throw unauthorizedError()
    }

    return {
      user: session.user,
      session: session.session,
    }
  })

export const authModuleRoutes = new Elysia({ name: 'auth-module-routes' })
  .use(authRateLimit)
  .all('/*', async ({ request }) => {
    if (['POST', 'GET'].includes(request.method)) {
      return await auth.handler(request)
    }

    throw http.error({
      code: http.codes.METHOD_NOT_ALLOWED,
      message: http.messages.METHOD_NOT_ALLOWED,
      status: http.status.METHOD_NOT_ALLOWED,
    })
  })
