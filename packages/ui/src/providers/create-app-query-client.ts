import { MutationCache, QueryCache, QueryClient } from '@tanstack/react-query'

const QUERY_STALE_TIME_MS = 30_000
const QUERY_GC_TIME_MS = 300_000
const QUERY_MAX_RETRIES = 3

export interface CreateAppQueryClientOptions {
  isUnauthorized?: (error: unknown) => boolean
  onUnauthorized?: () => void
}

function defaultIsUnauthorized(error: unknown): boolean {
  if (typeof error === 'object' && error !== null && 'status' in error) {
    return (error as { status?: number }).status === 401
  }

  return false
}

export function createAppQueryClient(
  options: CreateAppQueryClientOptions = {},
): QueryClient {
  const isUnauthorized = options.isUnauthorized ?? defaultIsUnauthorized
  let queryClient!: QueryClient

  const onError = (error: unknown) => {
    if (isUnauthorized(error)) {
      queryClient.clear()
      options.onUnauthorized?.()
    }
  }

  queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: QUERY_STALE_TIME_MS,
        gcTime: QUERY_GC_TIME_MS,
        refetchOnWindowFocus: true,
        retry: (failureCount, error) =>
          !isUnauthorized(error) && failureCount < QUERY_MAX_RETRIES,
      },
      mutations: {
        retry: false,
      },
    },
    queryCache: new QueryCache({ onError }),
    mutationCache: new MutationCache({ onError }),
  })

  return queryClient
}
