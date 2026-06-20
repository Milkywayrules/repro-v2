import { readyQueryOptions } from '@repro-v2/api-client/queries'
import { useQuery } from '@tanstack/react-query'

import { apiClient } from '@/lib/api-client'

export function ApiReadyDot() {
  const { data, isPending, isError } = useQuery(readyQueryOptions(apiClient))
  const ready = !(isPending || isError) && data?.status === 'ready'

  let state: 'pending' | 'ready' | 'error' = 'error'
  if (isPending) {
    state = 'pending'
  } else if (ready) {
    state = 'ready'
  }

  let ariaLabel = 'API not ready'
  if (state === 'pending') {
    ariaLabel = 'Checking API readiness'
  } else if (state === 'ready') {
    ariaLabel = 'API ready'
  }

  return (
    <span
      aria-label={ariaLabel}
      className={`ready-dot ready-dot--${state}`}
      role="status"
      title={ready ? 'API ready' : 'API not ready'}
    />
  )
}
