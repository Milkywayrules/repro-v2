import {
  createTaskBody,
  taskIdParams,
  taskListFilterQuery,
  updateTaskBody,
} from '@repro-v2/api-schemas/modules/tasks'
import { Elysia } from 'elysia'

import { http } from '@/libs/contract'
import { paginatedList } from '@/libs/queries/paginated-list'
import { requireAuth } from '@/modules/auth/routes'

import { tasksService } from './service'

export const tasksRoutes = new Elysia({ name: 'tasks-routes' })
  .use(requireAuth)
  .get(
    '/',
    async ({ user, query, request }) => {
      const searchParams = new URL(request.url).searchParams
      const { rows, meta } = await paginatedList({
        searchParams,
        allowedSortFields: ['title'],
        query: ({ page, pageSize, sort }) =>
          tasksService.list(user.id, page, pageSize, query.listId, sort),
      })

      return http.okV1(rows.map(tasksService.toResponse), meta)
    },
    { query: taskListFilterQuery },
  )
  .post(
    '/',
    async ({ user, body }) => {
      const row = await tasksService.create(user.id, body)
      return http.okV1(tasksService.toResponse(row))
    },
    { body: createTaskBody },
  )
  .get(
    '/:id',
    async ({ user, params }) => {
      const row = await tasksService.getForUser(user.id, params.id)
      return http.okV1(tasksService.toResponse(row))
    },
    { params: taskIdParams },
  )
  .patch(
    '/:id',
    async ({ user, params, body }) => {
      if (body.title === undefined && body.completed === undefined) {
        const row = await tasksService.getForUser(user.id, params.id)
        return http.okV1(tasksService.toResponse(row))
      }

      const row = await tasksService.update(user.id, params.id, body)
      return http.okV1(tasksService.toResponse(row))
    },
    { params: taskIdParams, body: updateTaskBody },
  )
  .delete(
    '/:id',
    async ({ user, params }) => {
      const row = await tasksService.delete(user.id, params.id)
      return http.okV1(tasksService.toResponse(row))
    },
    { params: taskIdParams },
  )
