import { queryOptions } from '@tanstack/react-query'

import type { ApiClient } from '../index'
import { unwrapTreatyResponse } from './treaty'

const PROBE_STALE_TIME_MS = 30_000 // matches QUERY_STALE_TIME_MS in @repro-v2/ui

export const platformKeys = {
  all: ['platform'] as const,
  health: () => [...platformKeys.all, 'health'] as const,
  root: () => [...platformKeys.all, 'root'] as const,
  ready: () => [...platformKeys.all, 'ready'] as const,
}

interface ReadyProbe {
  checks?: Record<string, unknown>
  status: 'ready' | 'not_ready'
}

interface TreatyResult<T> {
  data: T | null
  error: unknown
}

function isReadyProbe(value: unknown): value is ReadyProbe {
  return (
    typeof value === 'object' &&
    value !== null &&
    'status' in value &&
    ((value as ReadyProbe).status === 'ready' ||
      (value as ReadyProbe).status === 'not_ready')
  )
}

function treatyPayload(error: unknown): unknown {
  if (typeof error === 'object' && error !== null && 'value' in error) {
    return (error as { value?: unknown }).value
  }

  return error
}

function unwrapReadyResponse(response: TreatyResult<ReadyProbe>): ReadyProbe {
  if (response.data !== null && isReadyProbe(response.data)) {
    return response.data
  }

  if (response.error) {
    const payload = treatyPayload(response.error)
    if (isReadyProbe(payload)) {
      return payload
    }

    throw response.error
  }

  throw new Error('Empty treaty response')
}

function platformQueryDefaults<T extends readonly unknown[]>(queryKey: T) {
  return {
    queryKey,
    retry: false as const,
    staleTime: PROBE_STALE_TIME_MS,
  }
}

export function healthQueryOptions(client: ApiClient) {
  return queryOptions({
    ...platformQueryDefaults(platformKeys.health()),
    queryFn: async () => {
      const response = await client.health.get()
      return unwrapTreatyResponse(response)
    },
  })
}

export function rootQueryOptions(client: ApiClient) {
  return queryOptions({
    ...platformQueryDefaults(platformKeys.root()),
    queryFn: async () => {
      const response = await client.get()
      return unwrapTreatyResponse(response)
    },
  })
}

export function readyQueryOptions(client: ApiClient) {
  return queryOptions({
    ...platformQueryDefaults(platformKeys.ready()),
    queryFn: async () => {
      const response = await client.ready.get()
      return unwrapReadyResponse(response)
    },
  })
}

export type { ReadyProbe }
