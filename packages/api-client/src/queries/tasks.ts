import { queryOptions } from '@tanstack/react-query'

import { type ApiClient, type TaskListResponse, tasksApi } from '../index'
import { taskKeys } from './keys'
import { unwrapTreatyResponse } from './treaty'

export function tasksByListQueryOptions(
  client: ApiClient,
  listId: string,
  workspaceSlug?: string,
) {
  return queryOptions({
    queryKey: taskKeys.list(listId, workspaceSlug),
    queryFn: async () => {
      const response = await tasksApi(client, workspaceSlug).get({
        query: { listId },
      })
      return unwrapTreatyResponse(
        response,
      ) as TaskListResponse as TaskListResponse
    },
  })
}

export async function createTask(
  client: ApiClient,
  body: { title: string; listId: string },
  workspaceSlug?: string,
) {
  const response = await tasksApi(client, workspaceSlug).post(body)
  return unwrapTreatyResponse(response) as TaskListResponse
}

export async function patchTask(
  client: ApiClient,
  id: string,
  body: { completed: boolean },
  workspaceSlug?: string,
) {
  const response = await tasksApi(client, workspaceSlug)({ id }).patch(body)
  return unwrapTreatyResponse(response) as TaskListResponse
}

export async function deleteTask(
  client: ApiClient,
  id: string,
  workspaceSlug?: string,
) {
  const response = await tasksApi(client, workspaceSlug)({ id }).delete()
  return unwrapTreatyResponse(response) as TaskListResponse
}
