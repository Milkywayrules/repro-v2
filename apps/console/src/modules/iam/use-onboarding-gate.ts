'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

import { iamClient } from '@/lib/iam-client'
import { routes } from '@/lib/routes'

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
  const { features, isPending: featuresPending } = useIamFeatures()
  const [state, setState] = useState<OnboardingGateState>(checkingState)

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
      const { data: organizations, error } = await iamClient.organization.list()

      if (cancelled) {
        return
      }

      if (error) {
        setState({
          isChecking: false,
          error: error.message ?? 'Could not load workspaces',
        })
        return
      }

      if (!organizations?.length) {
        router.replace(routes.onboarding)
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
  }, [features?.workspace, featuresPending, router, sessionUserId])

  return state
}
