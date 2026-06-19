import { queryOptions } from '@tanstack/react-query'

import type { ApiClient } from '../index'
import { taskListKeys } from './keys'
import { unwrapTreatyResponse } from './treaty'

export function taskListQueryOptions(client: ApiClient) {
  return queryOptions({
    queryKey: taskListKeys.lists(),
    queryFn: async () => {
      const response = await client.api.v1['task-lists'].get()
      return unwrapTreatyResponse(response)
    },
  })
}

export async function createTaskList(
  client: ApiClient,
  body: { name: string },
) {
  const response = await client.api.v1['task-lists'].post(body)
  return unwrapTreatyResponse(response)
}

export async function deleteTaskList(client: ApiClient, id: string) {
  const response = await client.api.v1['task-lists']({ id }).delete()
  return unwrapTreatyResponse(response)
}

export async function patchTaskList(
  client: ApiClient,
  id: string,
  body: { name: string },
) {
  const response = await client.api.v1['task-lists']({ id }).patch(body)
  return unwrapTreatyResponse(response)
}
