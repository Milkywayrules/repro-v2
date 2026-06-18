import { Elysia } from 'elysia'

import { http } from '@/libs/contract'
import { paginatedList } from '@/libs/queries/paginated-list'
import { requireAuth } from '@/modules/auth/routes'

import {
  createTaskListBody,
  taskListIdParams,
  updateTaskListBody,
} from './schemas'
import {
  createTaskList,
  deleteTaskList,
  getTaskListForUser,
  listTaskLists,
  toTaskListResponse,
  updateTaskList,
} from './service'

export const taskListsRoutes = new Elysia({ name: 'task-lists-routes' })
  .use(requireAuth)
  .get('/', async ({ user, request }) => {
    const searchParams = new URL(request.url).searchParams
    const { rows, meta } = await paginatedList({
      searchParams,
      allowedSortFields: ['name'],
      query: ({ page, pageSize, sort }) =>
        listTaskLists(user.id, page, pageSize, sort),
    })

    return http.okV1(rows.map(toTaskListResponse), meta)
  })
  .post(
    '/',
    async ({ user, body }) => {
      const row = await createTaskList(user.id, body.name)
      return http.okV1(toTaskListResponse(row))
    },
    { body: createTaskListBody },
  )
  .get(
    '/:id',
    async ({ user, params }) => {
      const row = await getTaskListForUser(user.id, params.id)
      return http.okV1(toTaskListResponse(row))
    },
    { params: taskListIdParams },
  )
  .patch(
    '/:id',
    async ({ user, params, body }) => {
      if (body.name === undefined) {
        const row = await getTaskListForUser(user.id, params.id)
        return http.okV1(toTaskListResponse(row))
      }

      const row = await updateTaskList(user.id, params.id, body.name)
      return http.okV1(toTaskListResponse(row))
    },
    { params: taskListIdParams, body: updateTaskListBody },
  )
  .delete(
    '/:id',
    async ({ user, params }) => {
      const row = await deleteTaskList(user.id, params.id)
      return http.okV1(toTaskListResponse(row))
    },
    { params: taskListIdParams },
  )
