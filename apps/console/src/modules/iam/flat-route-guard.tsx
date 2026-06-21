'use client'

import { useEffect } from 'react'
import type { Route } from 'next'
import { useRouter } from 'next/navigation'

import { Loader } from '@/components/loader'
import { workspaceRoutes } from '@/lib/routes'
import { pickDefaultWorkspaceSlug } from '@/modules/iam/list-workspaces'
import { useIamFeatures } from '@/modules/iam/use-iam-features'

type FlatSubPath = keyof ReturnType<typeof workspaceRoutes>

interface FlatRouteGuardProps {
  children: React.ReactNode
  subPath: FlatSubPath
}

/** When workspace URLs are enabled, flat /dashboard-style routes redirect to /{slug}/…. */
export function FlatRouteGuard({ subPath, children }: FlatRouteGuardProps) {
  const router = useRouter()
  const { features, isPending: featuresPending } = useIamFeatures()

  useEffect(() => {
    if (featuresPending || !features?.workspace) {
      return
    }

    let cancelled = false

    async function redirectToWorkspace() {
      const slug = await pickDefaultWorkspaceSlug()
      if (cancelled) {
        return
      }

      router.replace(
        (slug ? workspaceRoutes(slug)[subPath] : '/onboarding') as Route,
      )
    }

    redirectToWorkspace().catch(() => {
      if (!cancelled) {
        router.replace('/login' as Route)
      }
    })

    return () => {
      cancelled = true
    }
  }, [features?.workspace, featuresPending, router, subPath])

  if (featuresPending || features?.workspace) {
    return <Loader />
  }

  return children
}
