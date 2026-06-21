import {
  createTaskListBody,
  taskListIdParams,
  updateTaskListBody,
} from '@repro-v2/api-schemas/modules/task-lists'
import { iamFeatures } from '@repro-v2/env/api'
import { Elysia } from 'elysia'

import { http } from '@/libs/contract'
import { paginatedList } from '@/libs/queries/paginated-list'
import { requireActiveWorkspace } from '@/modules/iam/require-active-workspace'
import { requireWorkspaceFromPath } from '@/modules/iam/require-workspace-from-path'

import { taskListsService } from './service'

const workspaceGuard = iamFeatures.workspace
  ? requireWorkspaceFromPath
  : requireActiveWorkspace

export const taskListsRoutes = new Elysia({ name: 'task-lists-routes' })
  .use(workspaceGuard)
  .get('/', async ({ user, workspaceId, request }) => {
    const searchParams = new URL(request.url).searchParams
    const { rows, meta } = await paginatedList({
      searchParams,
      allowedSortFields: ['name'],
      query: ({ page, pageSize, sort }) =>
        taskListsService.list(user.id, workspaceId, page, pageSize, sort),
    })

    return http.okV1(rows.map(taskListsService.toResponse), meta)
  })
  .post(
    '/',
    async ({ user, workspaceId, body }) => {
      const row = await taskListsService.create(user.id, workspaceId, body.name)
      return http.okV1(taskListsService.toResponse(row))
    },
    { body: createTaskListBody },
  )
  .get(
    '/:id',
    async ({ user, workspaceId, params }) => {
      const row = await taskListsService.getForUser(
        user.id,
        workspaceId,
        params.id,
      )
      return http.okV1(taskListsService.toResponse(row))
    },
    { params: taskListIdParams },
  )
  .patch(
    '/:id',
    async ({ user, workspaceId, params, body }) => {
      if (body.name === undefined) {
        const row = await taskListsService.getForUser(
          user.id,
          workspaceId,
          params.id,
        )
        return http.okV1(taskListsService.toResponse(row))
      }

      const row = await taskListsService.update(
        user.id,
        workspaceId,
        params.id,
        body.name,
      )
      return http.okV1(taskListsService.toResponse(row))
    },
    { params: taskListIdParams, body: updateTaskListBody },
  )
  .delete(
    '/:id',
    async ({ user, workspaceId, params }) => {
      const row = await taskListsService.delete(user.id, workspaceId, params.id)
      return http.okV1(taskListsService.toResponse(row))
    },
    { params: taskListIdParams },
  )
