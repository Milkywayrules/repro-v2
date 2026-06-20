import { Elysia } from 'elysia'

import { iamModuleRoutes } from '@/modules/iam/routes'

export const authRoutes = new Elysia({ name: 'auth-routes' }).group(
  '/api/auth',
  app => app.use(iamModuleRoutes),
)
