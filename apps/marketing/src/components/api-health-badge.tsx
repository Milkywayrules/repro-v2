'use client'

import { healthQueryOptions } from '@repro-v2/api-client/queries'
import { useQuery } from '@tanstack/react-query'

import { apiClient } from '@/lib/api-client'

export function ApiHealthBadge() {
  const { data, isPending, isError } = useQuery(healthQueryOptions(apiClient))

  if (isPending) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-muted-foreground text-xs">
        API checking…
      </span>
    )
  }

  const healthy = !isError && data?.status === 'ok'

  return (
    <span
      className={
        healthy
          ? 'inline-flex items-center gap-1.5 rounded-full border border-green-500/30 bg-green-500/10 px-2.5 py-0.5 text-green-700 text-xs dark:text-green-400'
          : 'inline-flex items-center gap-1.5 rounded-full border border-destructive/30 bg-destructive/10 px-2.5 py-0.5 text-destructive text-xs'
      }
    >
      <span
        aria-hidden
        className={`size-1.5 rounded-full ${healthy ? 'bg-green-500' : 'bg-destructive'}`}
      />
      API {healthy ? 'healthy' : 'unreachable'}
    </span>
  )
}
