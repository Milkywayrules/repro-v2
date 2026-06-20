import { Elysia } from 'elysia'

import { http } from '@/libs/contract'
import { unauthorizedError } from '@/libs/contract/errors'
import { authRateLimit } from '@/libs/middleware'

import { iamSession } from './context'
import { iam } from './iam'

export const requireIam = new Elysia({ name: 'require-iam' })
  .use(iamSession)
  .resolve({ as: 'scoped' }, ({ iamSession: session }) => {
    if (!session) {
      throw unauthorizedError()
    }

    return {
      user: session.user,
      session: session.session,
    }
  })

export const iamModuleRoutes = new Elysia({ name: 'iam-module-routes' })
  .use(authRateLimit)
  .all('/*', async ({ request }) => {
    if (['POST', 'GET'].includes(request.method)) {
      return await iam.handler(request)
    }

    throw http.error({
      code: http.codes.METHOD_NOT_ALLOWED,
      message: http.messages.METHOD_NOT_ALLOWED,
      status: http.status.METHOD_NOT_ALLOWED,
    })
  })
