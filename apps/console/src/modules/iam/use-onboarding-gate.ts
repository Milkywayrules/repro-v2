'use client'

import { useEffect, useState } from 'react'
import type { Route } from 'next'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'

import { buildOnboardingPath } from './auth-redirect'
import { listWorkspaces } from './list-workspaces'
import { useIamFeatures } from './use-iam-features'

interface OnboardingGateState {
  error: string | null
  isChecking: boolean
}

const idleState: OnboardingGateState = {
  isChecking: false,
  error: null,
}

const checkingState: OnboardingGateState = {
  isChecking: true,
  error: null,
}

export function useOnboardingGate(sessionUserId: string | undefined) {
  const router = useRouter()
  const pathname = usePathname()
  const urlSearchParams = useSearchParams()
  const { features, isPending: featuresPending } = useIamFeatures()
  const [state, setState] = useState<OnboardingGateState>(checkingState)

  const currentPath = urlSearchParams.size
    ? `${pathname}?${urlSearchParams.toString()}`
    : pathname

  useEffect(() => {
    if (featuresPending) {
      setState(checkingState)
      return
    }

    if (!(sessionUserId && features?.workspace)) {
      setState(idleState)
      return
    }

    let cancelled = false
    setState(checkingState)

    async function ensureWorkspace() {
      const listed = await listWorkspaces()

      if (cancelled) {
        return
      }

      if (!listed.ok) {
        setState({
          isChecking: false,
          error: listed.error,
        })
        return
      }

      if (!listed.workspaces.length) {
        router.replace(buildOnboardingPath(currentPath) as Route)
        return
      }

      setState(idleState)
    }

    ensureWorkspace().catch(() => {
      if (!cancelled) {
        setState({
          isChecking: false,
          error: 'Could not load workspaces',
        })
      }
    })

    return () => {
      cancelled = true
    }
  }, [currentPath, features?.workspace, featuresPending, router, sessionUserId])

  return state
}
