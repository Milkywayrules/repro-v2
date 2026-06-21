import { env } from '@repro-v2/env/console'
import { isReservedWorkspaceSlug } from '@repro-v2/iam/reserved-workspace-slugs'

import { routes, workspaceRoutes } from '@/lib/routes'

import {
  listWorkspaces,
  pickDefaultWorkspaceSlug,
  pickSlugFromWorkspaces,
  type WorkspaceSummary,
} from './list-workspaces'
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

function rewriteWorkspaceScopedPath(
  path: string,
  workspaces: WorkspaceSummary[],
  defaultSlug: string,
): string {
  const pathname = path.split('?')[0] ?? path
  const query = path.includes('?') ? path.slice(path.indexOf('?')) : ''
  const segments = pathname.split('/').filter(Boolean)

  if (segments.length === 0) {
    return workspaceRoutes(defaultSlug).dashboard
  }

  const first = segments[0]
  if (
    !first ||
    isReservedWorkspaceSlug(first) ||
    FLAT_SUB_PATHS.has(first as WorkspaceSubPath)
  ) {
    return path
  }

  const isMember = workspaces.some(ws => ws.slug === first)
  if (isMember) {
    return path
  }

  const subPath =
    segments.length > 1 ? segments.slice(1).join('/') : 'dashboard'
  return `/${defaultSlug}/${subPath}${query}`
}

async function scopePathForWorkspace(
  path: string,
  features: PublicIamFeatures | undefined,
  workspaces?: WorkspaceSummary[],
  defaultSlug?: string | null,
): Promise<string> {
  if (!features?.workspace) {
    return path
  }

  const flatSubPath = flatSubPathFromPath(path)
  if (flatSubPath) {
    const slug =
      defaultSlug ??
      (workspaces
        ? pickSlugFromWorkspaces(workspaces)
        : await pickDefaultWorkspaceSlug())
    if (!slug) {
      return routes.onboarding
    }

    return workspaceRoutes(slug)[flatSubPath]
  }

  if (workspaces && defaultSlug) {
    return rewriteWorkspaceScopedPath(path, workspaces, defaultSlug)
  }

  const listed = await listWorkspaces()
  if (!listed.ok || listed.workspaces.length === 0) {
    return routes.onboarding
  }

  const slug = pickSlugFromWorkspaces(listed.workspaces)
  if (!slug) {
    return routes.onboarding
  }

  return rewriteWorkspaceScopedPath(path, listed.workspaces, slug)
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
  workspaces?: WorkspaceSummary[],
  defaultSlug?: string | null,
): Promise<string> {
  if (nextPath && isSafeInternalPath(nextPath)) {
    return scopePathForWorkspace(nextPath, features, workspaces, defaultSlug)
  }

  if (!features?.workspace) {
    return '/dashboard'
  }

  const slug =
    defaultSlug ??
    (workspaces
      ? pickSlugFromWorkspaces(workspaces)
      : await pickDefaultWorkspaceSlug())
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
