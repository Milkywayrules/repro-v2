'use client'

import { useEffect, useState } from 'react'
import type { Route } from 'next'
import { useRouter } from 'next/navigation'

import { Loader } from '@/components/loader'
import { PageErrorState } from '@/components/page-error-state'
import { iamClient } from '@/lib/iam-client'
import { routes, workspaceRoutes } from '@/lib/routes'
import {
  listWorkspaces,
  pickSlugFromWorkspaces,
} from '@/modules/iam/list-workspaces'
import { useIamFeatures } from '@/modules/iam/use-iam-features'

type FlatSubPath = keyof ReturnType<typeof workspaceRoutes>

interface FlatRouteGuardProps {
  children: React.ReactNode
  subPath: FlatSubPath
}

type GuardState =
  | { status: 'loading' }
  | { status: 'ready' }
  | { status: 'error'; message: string }

/** When workspace URLs are enabled, flat /dashboard-style routes redirect to /{slug}/…. */
export function FlatRouteGuard({ subPath, children }: FlatRouteGuardProps) {
  const router = useRouter()
  const { features, isPending: featuresPending } = useIamFeatures()
  const { data: session, isPending: sessionPending } = iamClient.useSession()
  const [state, setState] = useState<GuardState>({ status: 'loading' })

  useEffect(() => {
    if (featuresPending || sessionPending) {
      setState({ status: 'loading' })
      return
    }

    if (!session?.user) {
      router.replace(routes.login as Route)
      return
    }

    if (!features?.workspace) {
      setState({ status: 'ready' })
      return
    }

    let cancelled = false
    setState({ status: 'loading' })

    async function redirectToWorkspace() {
      const listed = await listWorkspaces()
      if (cancelled) {
        return
      }

      if (!listed.ok) {
        setState({ status: 'error', message: listed.error })
        return
      }

      const slug = pickSlugFromWorkspaces(listed.workspaces)
      if (!slug) {
        router.replace(routes.onboarding as Route)
        return
      }

      router.replace(workspaceRoutes(slug)[subPath] as Route)
    }

    redirectToWorkspace().catch(() => {
      if (!cancelled) {
        setState({
          status: 'error',
          message: 'Could not load workspaces',
        })
      }
    })

    return () => {
      cancelled = true
    }
  }, [
    features?.workspace,
    featuresPending,
    router,
    session?.user,
    sessionPending,
    subPath,
  ])

  if (
    featuresPending ||
    sessionPending ||
    (features?.workspace && state.status === 'loading')
  ) {
    return <Loader />
  }

  if (state.status === 'error') {
    return <PageErrorState message={state.message} title="Could not continue" />
  }

  return children
}
