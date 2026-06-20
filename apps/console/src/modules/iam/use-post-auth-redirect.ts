'use client'

import { useCallback } from 'react'
import type { Route } from 'next'
import { useRouter } from 'next/navigation'

import { parseAsString, useQueryState } from 'nuqs'
import { toast } from 'sonner'

import { iamClient } from '@/lib/iam-client'
import { routes } from '@/lib/routes'
import { searchParams } from '@/lib/search-params'

import { resolvePostAuthPath } from './auth-redirect'
import type { PublicIamFeatures } from './types'

export function usePostAuthRedirect() {
  const router = useRouter()
  const [nextPath] = useQueryState(searchParams.next, parseAsString)

  return useCallback(
    async (features: PublicIamFeatures | undefined) => {
      if (features?.workspace) {
        const { data: organizations, error } =
          await iamClient.organization.list()

        if (error) {
          toast.error(error.message ?? 'Could not load workspaces')
          return
        }

        if (!organizations?.length) {
          router.push(routes.onboarding)
          return
        }
      }

      router.push(resolvePostAuthPath(nextPath) as Route)
    },
    [nextPath, router],
  )
}
