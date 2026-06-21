'use client'

import { useEffect } from 'react'
import type { Route } from 'next'
import { useRouter } from 'next/navigation'

import { iamClient } from '@/lib/iam-client'
import { routes } from '@/lib/routes'

import {
  mapOrganizationsToWorkspaces,
  pickDefaultWorkspaceSlug,
} from './list-workspaces'
import { useIamFeatures } from './use-iam-features'

/** Redirects when the URL workspace slug is not in the signed-in user's org list. */
export function useWorkspaceMembershipGuard(workspaceSlug: string): boolean {
  const router = useRouter()
  const { features, isPending: featuresPending } = useIamFeatures()
  const { data: session, isPending: sessionPending } = iamClient.useSession()
  const { data: organizations, isPending: orgsPending } =
    iamClient.useListOrganizations()

  const workspaceEnabled = Boolean(features?.workspace)
  const workspaces = mapOrganizationsToWorkspaces(organizations)

  const checking =
    featuresPending ||
    sessionPending ||
    orgsPending ||
    (workspaceEnabled && session?.user && organizations === undefined)

  const isMember =
    !workspaceEnabled ||
    (workspaces.some(workspace => workspace.slug === workspaceSlug) ?? false)

  useEffect(() => {
    if (checking || !workspaceEnabled) {
      return
    }

    if (!session?.user) {
      router.replace(routes.login as Route)
      return
    }

    if (isMember) {
      return
    }

    let cancelled = false

    async function redirectAway() {
      const slug = await pickDefaultWorkspaceSlug()
      if (cancelled) {
        return
      }

      router.replace((slug ? `/${slug}/dashboard` : routes.onboarding) as Route)
    }

    redirectAway().catch(() => {
      if (!cancelled) {
        router.replace(routes.login as Route)
      }
    })

    return () => {
      cancelled = true
    }
  }, [checking, isMember, router, session?.user, workspaceEnabled])

  return !checking && isMember
}
