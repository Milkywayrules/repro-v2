import { env } from '@repro-v2/env/console'

import { routes } from '@/lib/routes'
import { searchParams } from '@/lib/search-params'

export function isSafeInternalPath(path: string): boolean {
  if (!path.startsWith('/') || path.startsWith('//')) {
    return false
  }

  if (path.includes('\\')) {
    return false
  }

  const lower = path.toLowerCase()
  if (lower.includes('%2f%2f') || lower.includes('%5c')) {
    return false
  }

  return true
}

export function resolvePostAuthPath(
  nextPath: string | null | undefined,
): string {
  if (nextPath && isSafeInternalPath(nextPath)) {
    return nextPath
  }

  return routes.dashboard
}

export function buildOnboardingPath(
  nextPath: string | null | undefined,
): string {
  if (nextPath && isSafeInternalPath(nextPath)) {
    return `${routes.onboarding}?${searchParams.next}=${encodeURIComponent(nextPath)}`
  }

  return routes.onboarding
}

export function buildAuthCallbackUrl(
  nextPath: string | null | undefined,
): string {
  return `${env.NEXT_PUBLIC_CONSOLE_URL}${resolvePostAuthPath(nextPath)}`
}
