import { Elysia } from 'elysia'

import { authModuleRoutes } from '@/modules/auth/routes'

export const authRoutes = new Elysia({ name: 'auth-routes' }).group(
  '/api/auth',
  app => app.use(authModuleRoutes),
)
