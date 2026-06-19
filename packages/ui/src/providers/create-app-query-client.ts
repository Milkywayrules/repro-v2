import { isTreatyUnauthorized } from '@repro-v2/api-client'
import { MutationCache, QueryCache, QueryClient } from '@tanstack/react-query'

export interface CreateAppQueryClientOptions {
  onUnauthorized?: () => void
}

function createUnauthorizedErrorHandler(onUnauthorized?: () => void) {
  return (error: unknown) => {
    if (isTreatyUnauthorized(error) && onUnauthorized) {
      onUnauthorized()
    }
  }
}

export function createAppQueryClient(
  options: CreateAppQueryClientOptions = {},
): QueryClient {
  const onError = createUnauthorizedErrorHandler(options.onUnauthorized)

  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        gcTime: 5 * 60_000,
        refetchOnWindowFocus: true,
        retry: (failureCount, error) =>
          !isTreatyUnauthorized(error) && failureCount < 3,
      },
      mutations: {
        retry: (_failureCount, error) => !isTreatyUnauthorized(error),
      },
    },
    queryCache: new QueryCache({ onError }),
    mutationCache: new MutationCache({ onError }),
  })
}
