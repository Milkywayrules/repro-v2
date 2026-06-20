import { Elysia } from 'elysia'

import { http } from '@/libs/contract'
import { csrfOriginValidation } from '@/libs/middleware'
import { requireIam } from '@/modules/iam/routes'
import { platformModuleRoutes } from '@/modules/platform/routes'
import { taskListsRoutes } from '@/modules/task-lists/routes'
import { tasksRoutes } from '@/modules/tasks/routes'

const v1RootRoute = new Elysia({ name: 'v1-root' })
  .use(requireIam)
  .get('/', () => http.okV1({ status: 'ok' }))

export const v1Routes = new Elysia({ name: 'v1-routes' }).group(
  '/api/v1',
  app =>
    app
      .use(csrfOriginValidation)
      .use(v1RootRoute)
      .group('/platform', platformApp => platformApp.use(platformModuleRoutes))
      .group('/task-lists', taskListApp => taskListApp.use(taskListsRoutes))
      .group('/tasks', taskApp => taskApp.use(tasksRoutes)),
)
