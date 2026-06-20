import { env } from '@repro-v2/env/console'

import { routes } from '@/lib/routes'

export function resolvePostAuthPath(
  nextPath: string | null | undefined,
): string {
  if (nextPath?.startsWith('/')) {
    return nextPath
  }

  return routes.dashboard
}

export function buildAuthCallbackUrl(
  nextPath: string | null | undefined,
): string {
  return `${env.NEXT_PUBLIC_CONSOLE_URL}${resolvePostAuthPath(nextPath)}`
}
