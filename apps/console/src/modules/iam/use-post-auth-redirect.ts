'use client'

import { useCallback } from 'react'
import type { Route } from 'next'
import { useRouter } from 'next/navigation'

import { parseAsString, useQueryState } from 'nuqs'

import { iamClient } from '@/lib/iam-client'
import { searchParams } from '@/lib/search-params'

import { buildOnboardingPath, resolvePostAuthPath } from './auth-redirect'
import type { PublicIamFeatures } from './types'

export type PostAuthRedirectResult = { ok: true } | { ok: false; error: string }

export function usePostAuthRedirect() {
  const router = useRouter()
  const [nextPath] = useQueryState(searchParams.next, parseAsString)

  return useCallback(
    async (
      features: PublicIamFeatures | undefined,
    ): Promise<PostAuthRedirectResult> => {
      if (features?.workspace) {
        const { data: organizations, error } =
          await iamClient.organization.list()

        if (error) {
          return {
            ok: false,
            error: error.message ?? 'Could not load workspaces',
          }
        }

        if (!organizations?.length) {
          router.push(buildOnboardingPath(nextPath) as Route)
          return { ok: true }
        }
      }

      router.push(resolvePostAuthPath(nextPath) as Route)
      return { ok: true }
    },
    [nextPath, router],
  )
}
