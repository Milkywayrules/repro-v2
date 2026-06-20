import { env } from '@repro-v2/env/console'

import { routes } from '@/lib/routes'
import { searchParams } from '@/lib/search-params'

export function isSafeInternalPath(path: string): boolean {
  return path.startsWith('/') && !path.startsWith('//')
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
