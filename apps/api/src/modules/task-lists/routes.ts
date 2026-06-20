import {
  createTaskListBody,
  taskListIdParams,
  updateTaskListBody,
} from '@repro-v2/api-schemas/modules/task-lists'
import { Elysia } from 'elysia'

import { http } from '@/libs/contract'
import { paginatedList } from '@/libs/queries/paginated-list'
import { requireIam } from '@/modules/iam/routes'

import { taskListsService } from './service'

export const taskListsRoutes = new Elysia({ name: 'task-lists-routes' })
  .use(requireIam)
  .get('/', async ({ user, request }) => {
    const searchParams = new URL(request.url).searchParams
    const { rows, meta } = await paginatedList({
      searchParams,
      allowedSortFields: ['name'],
      query: ({ page, pageSize, sort }) =>
        taskListsService.list(user.id, page, pageSize, sort),
    })

    return http.okV1(rows.map(taskListsService.toResponse), meta)
  })
  .post(
    '/',
    async ({ user, body }) => {
      const row = await taskListsService.create(user.id, body.name)
      return http.okV1(taskListsService.toResponse(row))
    },
    { body: createTaskListBody },
  )
  .get(
    '/:id',
    async ({ user, params }) => {
      const row = await taskListsService.getForUser(user.id, params.id)
      return http.okV1(taskListsService.toResponse(row))
    },
    { params: taskListIdParams },
  )
  .patch(
    '/:id',
    async ({ user, params, body }) => {
      if (body.name === undefined) {
        const row = await taskListsService.getForUser(user.id, params.id)
        return http.okV1(taskListsService.toResponse(row))
      }

      const row = await taskListsService.update(user.id, params.id, body.name)
      return http.okV1(taskListsService.toResponse(row))
    },
    { params: taskListIdParams, body: updateTaskListBody },
  )
  .delete(
    '/:id',
    async ({ user, params }) => {
      const row = await taskListsService.delete(user.id, params.id)
      return http.okV1(taskListsService.toResponse(row))
    },
    { params: taskListIdParams },
  )
