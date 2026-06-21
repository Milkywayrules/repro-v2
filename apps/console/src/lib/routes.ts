import { isReservedWorkspaceSlug } from '@repro-v2/iam/reserved-workspace-slugs'

export const routes = {
  acceptInvitation: '/accept-invitation',
  login: '/login',
  onboarding: '/onboarding',
  home: '/',
} as const

export type WorkspaceSubPath = keyof ReturnType<typeof workspaceRoutes>

const FLAT_APP_SUB_PATHS = new Set<WorkspaceSubPath>([
  'dashboard',
  'tasks',
  'settings',
])

export function isFlatAppSubPath(segment: string): segment is WorkspaceSubPath {
  return FLAT_APP_SUB_PATHS.has(segment as WorkspaceSubPath)
}

/** Single-segment flat app path (/dashboard, /tasks, …), ignoring query string. */
export function flatSubPathFromPath(path: string): WorkspaceSubPath | null {
  const pathname = path.split('?')[0] ?? path
  const segments = pathname.split('/').filter(Boolean)

  if (segments.length !== 1) {
    return null
  }

  const segment = segments[0]
  return segment && isFlatAppSubPath(segment) ? segment : null
}

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
  if (segments.length === 1 && first && isFlatAppSubPath(first)) {
    return first
  }

  if (segments.length <= 1) {
    return 'dashboard'
  }

  return segments.slice(1).join('/')
}
