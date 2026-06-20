import { useQuery } from '@tanstack/react-query'

import { readyQuery } from '@/lib/api-client'

const labelByState = {
  pending: 'Checking API readiness',
  ready: 'API ready',
  error: 'API not ready',
} as const

export function ApiReadyDot() {
  const { data, isPending, isError } = useQuery(readyQuery)
  const ready = !(isPending || isError) && data?.status === 'ready'

  let state: keyof typeof labelByState = 'error'
  if (isPending) {
    state = 'pending'
  } else if (ready) {
    state = 'ready'
  }

  const label = labelByState[state]

  return (
    <span
      aria-label={label}
      className={`ready-dot ready-dot--${state}`}
      role="status"
      title={label}
    />
  )
}
