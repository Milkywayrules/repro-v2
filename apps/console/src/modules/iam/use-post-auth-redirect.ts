'use client'

import type { Route } from 'next'
import { useRouter } from 'next/navigation'

import type { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime'
import { parseAsString, useQueryState } from 'nuqs'

import { searchParams } from '@/lib/search-params'

import { buildOnboardingPath, resolvePostAuthPath } from './auth-redirect'
import { listWorkspaces, pickSlugFromWorkspaces } from './list-workspaces'
import type { PublicIamFeatures } from './types'

export type PostAuthRedirectResult = { ok: true } | { ok: false; error: string }

export async function runPostAuthRedirect(
  router: AppRouterInstance,
  nextPath: string | null | undefined,
  features: PublicIamFeatures | undefined,
): Promise<PostAuthRedirectResult> {
  if (!features?.workspace) {
    router.push((await resolvePostAuthPath(nextPath, features)) as Route)
    return { ok: true }
  }

  const listed = await listWorkspaces()

  if (!listed.ok) {
    return listed
  }

  if (!listed.workspaces.length) {
    router.push(buildOnboardingPath(nextPath) as Route)
    return { ok: true }
  }

  const defaultSlug = pickSlugFromWorkspaces(listed.workspaces)
  router.push(
    (await resolvePostAuthPath(
      nextPath,
      features,
      listed.workspaces,
      defaultSlug,
    )) as Route,
  )
  return { ok: true }
}

export function usePostAuthRedirect() {
  const router = useRouter()
  const [nextPath] = useQueryState(searchParams.next, parseAsString)

  return (features: PublicIamFeatures | undefined) =>
    runPostAuthRedirect(router, nextPath, features)
}
