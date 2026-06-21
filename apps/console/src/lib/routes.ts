import { isReservedWorkspaceSlug } from '@repro-v2/iam/reserved-workspace-slugs'

export const routes = {
  acceptInvitation: '/accept-invitation',
  login: '/login',
  onboarding: '/onboarding',
  home: '/',
} as const

const FLAT_APP_SUB_PATHS = new Set(['dashboard', 'tasks', 'settings'])

export function workspaceRoutes(workspaceSlug: string) {
  return {
    dashboard: `/${workspaceSlug}/dashboard`,
    tasks: `/${workspaceSlug}/tasks`,
    settings: `/${workspaceSlug}/settings`,
  } as const
}

/** First path segment when it is a workspace slug, not a reserved app route. */
export function parseWorkspaceFromPathname(pathname: string): string | null {
  const slug = pathname.split('/').filter(Boolean)[0]
  if (!slug || isReservedWorkspaceSlug(slug)) {
    return null
  }

  return slug
}

export function workspaceSubPathFromPathname(pathname: string): string {
  const segments = pathname.split('/').filter(Boolean)
  if (segments.length === 0) {
    return 'dashboard'
  }

  const first = segments[0]
  if (segments.length === 1 && first && FLAT_APP_SUB_PATHS.has(first)) {
    return first
  }

  if (segments.length <= 1) {
    return 'dashboard'
  }

  return segments.slice(1).join('/')
}
