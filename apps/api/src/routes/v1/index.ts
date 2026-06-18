import { Elysia } from 'elysia'

import { http } from '@/libs/contract'
import { csrfOriginValidation } from '@/libs/middleware'
import { requireAuth } from '@/modules/auth/routes'
import { taskListsRoutes } from '@/modules/task-lists/routes'
import { tasksRoutes } from '@/modules/tasks/routes'

const v1RootRoute = new Elysia({ name: 'v1-root' })
  .use(requireAuth)
  .get('/', () => http.okV1({ status: 'ok' }))

export const v1Routes = new Elysia({ name: 'v1-routes' }).group(
  '/api/v1',
  app =>
    app
      .use(csrfOriginValidation)
      .use(v1RootRoute)
      .group('/task-lists', taskListApp => taskListApp.use(taskListsRoutes))
      .group('/tasks', taskApp => taskApp.use(tasksRoutes)),
)
