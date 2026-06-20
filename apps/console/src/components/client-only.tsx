'use client'

import type { ReactNode } from 'react'

import { useClientMounted } from '@/hooks/use-client-mounted'

export function ClientOnly({
  children,
  fallback = null,
}: {
  children: ReactNode
  fallback?: ReactNode
}) {
  const mounted = useClientMounted()

  if (!mounted) {
    return fallback
  }

  return children
}
