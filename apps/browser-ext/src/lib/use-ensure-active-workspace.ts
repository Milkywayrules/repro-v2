import { useEffect, useState } from 'react'

import { ensureActiveWorkspace } from '@repro-v2/iam/workspace'

import { iamClient } from '@/lib/iam-client'

import { useIamFeatures } from './use-iam-features'

interface EnsureActiveWorkspaceState {
  error: string | null
  isReady: boolean
  workspaceId: string | null
}

const pendingState: EnsureActiveWorkspaceState = {
  isReady: false,
  workspaceId: null,
  error: null,
}

export function useEnsureActiveWorkspace(sessionUserId: string | undefined) {
  const { features, isPending: featuresPending } = useIamFeatures()
  const [state, setState] = useState<EnsureActiveWorkspaceState>(pendingState)

  useEffect(() => {
    if (featuresPending) {
      setState(pendingState)
      return
    }

    if (!sessionUserId) {
      setState({ isReady: false, workspaceId: null, error: null })
      return
    }

    if (!features?.workspace) {
      setState({ isReady: true, workspaceId: null, error: null })
      return
    }

    let cancelled = false
    setState(pendingState)

    ensureActiveWorkspace(iamClient)
      .then(result => {
        if (cancelled) {
          return
        }

        if (result.ok) {
          setState({
            isReady: true,
            workspaceId: result.workspaceId,
            error: null,
          })
          return
        }

        setState({
          isReady: false,
          workspaceId: null,
          error:
            result.error ??
            (result.reason === 'no_workspace'
              ? 'No workspace available'
              : 'Could not activate workspace'),
        })
      })
      .catch(() => {
        if (!cancelled) {
          setState({
            isReady: false,
            workspaceId: null,
            error: 'Could not activate workspace',
          })
        }
      })

    return () => {
      cancelled = true
    }
  }, [features?.workspace, featuresPending, sessionUserId])

  return state
}
