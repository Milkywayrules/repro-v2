'use client'

import type { Route } from 'next'
import { useRouter } from 'next/navigation'

import { parseAsString, useQueryState } from 'nuqs'

import { searchParams } from '@/lib/search-params'

import { buildOnboardingPath, resolvePostAuthPath } from './auth-redirect'
import { listWorkspaces } from './list-workspaces'
import type { PublicIamFeatures } from './types'

export type PostAuthRedirectResult = { ok: true } | { ok: false; error: string }

export function usePostAuthRedirect() {
  const router = useRouter()
  const [nextPath] = useQueryState(searchParams.next, parseAsString)

  async function redirectAfterAuth(
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

    router.push((await resolvePostAuthPath(nextPath, features)) as Route)
    return { ok: true }
  }

  return redirectAfterAuth
}
