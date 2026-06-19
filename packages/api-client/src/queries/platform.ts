import { queryOptions } from '@tanstack/react-query'

import type { ApiClient } from '../index'
import { unwrapTreatyResponse } from './treaty'

export const platformKeys = {
  all: ['platform'] as const,
  health: () => [...platformKeys.all, 'health'] as const,
  root: () => [...platformKeys.all, 'root'] as const,
  ready: () => [...platformKeys.all, 'ready'] as const,
}

export function healthQueryOptions(client: ApiClient) {
  return queryOptions({
    queryKey: platformKeys.health(),
    queryFn: async () => {
      const response = await client.health.get()
      return unwrapTreatyResponse(response)
    },
  })
}

export function rootQueryOptions(client: ApiClient) {
  return queryOptions({
    queryKey: platformKeys.root(),
    queryFn: async () => {
      const response = await client.get()
      return unwrapTreatyResponse(response)
    },
  })
}

export function readyQueryOptions(client: ApiClient) {
  return queryOptions({
    queryKey: platformKeys.ready(),
    queryFn: async () => {
      const response = await client.ready.get()
      return unwrapTreatyResponse(response)
    },
  })
}
