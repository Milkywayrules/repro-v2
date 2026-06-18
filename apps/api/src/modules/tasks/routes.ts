import { Elysia } from 'elysia'

import { http } from '@/libs/contract'
import { paginatedList } from '@/libs/queries/paginated-list'
import { requireAuth } from '@/modules/auth/routes'

import {
  createTaskBody,
  taskIdParams,
  taskListFilterQuery,
  updateTaskBody,
} from './schemas'
import {
  createTask,
  deleteTask,
  getTaskForUser,
  listTasks,
  toTaskResponse,
  updateTask,
} from './service'

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
          listTasks(user.id, page, pageSize, query.listId, sort),
      })

      return http.okV1(rows.map(toTaskResponse), meta)
    },
    { query: taskListFilterQuery },
  )
  .post(
    '/',
    async ({ user, body }) => {
      const row = await createTask(user.id, body)
      return http.okV1(toTaskResponse(row))
    },
    { body: createTaskBody },
  )
  .get(
    '/:id',
    async ({ user, params }) => {
      const row = await getTaskForUser(user.id, params.id)
      return http.okV1(toTaskResponse(row))
    },
    { params: taskIdParams },
  )
  .patch(
    '/:id',
    async ({ user, params, body }) => {
      if (body.title === undefined && body.completed === undefined) {
        const row = await getTaskForUser(user.id, params.id)
        return http.okV1(toTaskResponse(row))
      }

      const row = await updateTask(user.id, params.id, body)
      return http.okV1(toTaskResponse(row))
    },
    { params: taskIdParams, body: updateTaskBody },
  )
  .delete(
    '/:id',
    async ({ user, params }) => {
      const row = await deleteTask(user.id, params.id)
      return http.okV1(toTaskResponse(row))
    },
    { params: taskIdParams },
  )
