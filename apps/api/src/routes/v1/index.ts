import { Elysia } from 'elysia'

import { http } from '@/libs/contract'
import { csrfOriginValidation } from '@/libs/middleware'
import { requireIam } from '@/modules/iam/routes'
import { meRoutes } from '@/modules/me/routes'
import { platformModuleRoutes } from '@/modules/platform/routes'
import { taskListsRoutes } from '@/modules/task-lists/routes'
import { taskAttachmentsRoutes } from '@/modules/tasks/attachments-routes'
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
      .group('/me', meApp => meApp.use(meRoutes))
      .group('/platform', platformApp => platformApp.use(platformModuleRoutes))
      .group('/task-lists', taskListApp => taskListApp.use(taskListsRoutes))
      .group('/tasks', taskApp =>
        taskApp.use(taskAttachmentsRoutes).use(tasksRoutes),
      ),
)
