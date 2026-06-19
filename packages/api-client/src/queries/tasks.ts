import { queryOptions } from '@tanstack/react-query'

import type { ApiClient } from '../index'
import { taskKeys } from './keys'
import { unwrapTreatyResponse } from './treaty'

export function tasksByListQueryOptions(client: ApiClient, listId: string) {
  return queryOptions({
    queryKey: taskKeys.list(listId),
    queryFn: async () => {
      const response = await client.api.v1.tasks.get({
        query: { listId },
      })
      return unwrapTreatyResponse(response)
    },
  })
}

export async function createTask(
  client: ApiClient,
  body: { title: string; listId: string },
) {
  const response = await client.api.v1.tasks.post(body)
  return unwrapTreatyResponse(response)
}

export async function patchTask(
  client: ApiClient,
  id: string,
  body: { completed: boolean },
) {
  const response = await client.api.v1.tasks({ id }).patch(body)
  return unwrapTreatyResponse(response)
}

export async function deleteTask(client: ApiClient, id: string) {
  const response = await client.api.v1.tasks({ id }).delete()
  return unwrapTreatyResponse(response)
}
