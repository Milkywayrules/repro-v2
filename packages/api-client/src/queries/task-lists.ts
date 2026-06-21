import { queryOptions } from '@tanstack/react-query'

import {
  type ApiClient,
  type TaskListItemResponse,
  type TaskListListResponse,
  taskListsApi,
} from '../index'
import { taskListKeys } from './keys'
import { unwrapTreatyResponse } from './treaty'

export function taskListQueryOptions(
  client: ApiClient,
  workspaceSlug?: string,
) {
  return queryOptions({
    queryKey: taskListKeys.lists(workspaceSlug),
    queryFn: async () => {
      const response = await taskListsApi(client, workspaceSlug).get()
      return unwrapTreatyResponse(response) as TaskListListResponse
    },
  })
}

export async function createTaskList(
  client: ApiClient,
  body: { name: string },
  workspaceSlug?: string,
) {
  const response = await taskListsApi(client, workspaceSlug).post(body)
  return unwrapTreatyResponse(response) as TaskListItemResponse
}
