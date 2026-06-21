import { env } from '@repro-v2/env/console'

import { routes, workspaceRoutes } from '@/lib/routes'

import { pickDefaultWorkspaceSlug } from './list-workspaces'
import type { PublicIamFeatures } from './types'

type WorkspaceSubPath = keyof ReturnType<typeof workspaceRoutes>

const FLAT_SUB_PATHS = new Set<WorkspaceSubPath>([
  'dashboard',
  'tasks',
  'settings',
])

function flatSubPathFromPath(path: string): WorkspaceSubPath | null {
  const pathname = path.split('?')[0] ?? path
  const segments = pathname.split('/').filter(Boolean)

  if (segments.length !== 1) {
    return null
  }

  const segment = segments[0]
  if (!(segment && FLAT_SUB_PATHS.has(segment as WorkspaceSubPath))) {
    return null
  }

  return segment as WorkspaceSubPath
}

/** Rewrites /dashboard-style paths to /{slug}/…; returns null when path is not flat. */
export function rewriteFlatAppPath(path: string, slug: string): string | null {
  const flatSubPath = flatSubPathFromPath(path)
  if (!flatSubPath) {
    return null
  }

  return workspaceRoutes(slug)[flatSubPath]
}

async function scopePathForWorkspace(
  path: string,
  features: PublicIamFeatures | undefined,
): Promise<string> {
  if (!features?.workspace) {
    return path
  }

  const flatSubPath = flatSubPathFromPath(path)
  if (!flatSubPath) {
    return path
  }

  const slug = await pickDefaultWorkspaceSlug()
  if (!slug) {
    return routes.onboarding
  }

  return workspaceRoutes(slug)[flatSubPath]
}

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

export async function resolvePostAuthPath(
  nextPath: string | null | undefined,
  features: PublicIamFeatures | undefined,
): Promise<string> {
  if (nextPath && isSafeInternalPath(nextPath)) {
    return scopePathForWorkspace(nextPath, features)
  }

  if (!features?.workspace) {
    return '/dashboard'
  }

  const slug = await pickDefaultWorkspaceSlug()
  if (!slug) {
    return routes.onboarding
  }

  return workspaceRoutes(slug).dashboard
}

export function buildOnboardingPath(
  nextPath: string | null | undefined,
): string {
  if (nextPath && isSafeInternalPath(nextPath)) {
    return `${routes.onboarding}?next=${encodeURIComponent(nextPath)}`
  }

  return routes.onboarding
}

export function buildAuthCallbackUrl(
  nextPath: string | null | undefined,
  features?: { workspace?: boolean },
): string {
  const base = env.NEXT_PUBLIC_CONSOLE_URL

  if (features?.workspace) {
    if (nextPath && isSafeInternalPath(nextPath)) {
      return `${base}${routes.login}?next=${encodeURIComponent(nextPath)}`
    }

    return `${base}${routes.login}`
  }

  if (nextPath && isSafeInternalPath(nextPath)) {
    return `${base}${nextPath}`
  }

  return `${base}/dashboard`
}
