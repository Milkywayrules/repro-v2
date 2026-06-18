import { Elysia } from 'elysia'

import { healthRoutes } from '@/platform/health'

export const platformRoutes = new Elysia({ name: 'platform-routes' }).use(
  healthRoutes,
)
