import { MutationCache, QueryCache, QueryClient } from '@tanstack/react-query'

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
        staleTime: 30_000,
        gcTime: 5 * 60_000,
        refetchOnWindowFocus: true,
        retry: (failureCount, error) =>
          !isUnauthorized(error) && failureCount < 3,
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
