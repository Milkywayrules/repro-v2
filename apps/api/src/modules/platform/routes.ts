import { Elysia } from 'elysia'

import { iamFeaturesRoutes } from './iam-features/routes'

export const platformModuleRoutes = new Elysia({
  name: 'platform-module-routes',
}).group('/iam-features', app => app.use(iamFeaturesRoutes))
