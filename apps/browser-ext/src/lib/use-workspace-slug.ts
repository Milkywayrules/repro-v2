'use client'

import { useEffect, useState } from 'react'

import { workspacePublicSlug } from '@repro-v2/iam/workspace-storage-slug'

import { iamClient } from '@/lib/iam-client'
import { readLastWorkspaceSlug } from '@/lib/last-workspace-slug'

import { useIamFeatures } from './use-iam-features'

interface WorkspaceSlugState {
  error: string | null
  isReady: boolean
  workspaceSlug: string | null
}

const pendingState: WorkspaceSlugState = {
  isReady: false,
  workspaceSlug: null,
  error: null,
}

function pickWorkspaceSlug(
  organizations: Array<{
    slug?: string | null
    metadata?: unknown
    ownerUserId?: unknown
  }>,
  lastSlug: string | null,
  ownerUserId?: string,
): string | null {
  const mapped = organizations.flatMap(org => {
    if (typeof org.slug !== 'string') {
      return []
    }

    const owner =
      typeof org.ownerUserId === 'string' ? org.ownerUserId : ownerUserId

    return [workspacePublicSlug(org.slug, org.metadata, owner)]
  })

  if (lastSlug) {
    const match = mapped.find(slug => slug === lastSlug)
    if (match) {
      return match
    }
  }

  return mapped[0] ?? null
}

export function useWorkspaceSlug(sessionUserId: string | undefined) {
  const { features, isPending: featuresPending } = useIamFeatures()
  const [state, setState] = useState<WorkspaceSlugState>(pendingState)

  useEffect(() => {
    if (featuresPending) {
      setState(pendingState)
      return
    }

    if (!sessionUserId) {
      setState({ isReady: false, workspaceSlug: null, error: null })
      return
    }

    if (!features?.workspace) {
      setState({ isReady: true, workspaceSlug: null, error: null })
      return
    }

    let cancelled = false
    setState(pendingState)

    async function loadSlug() {
      const [{ data, error }, lastSlug] = await Promise.all([
        iamClient.organization.list(),
        readLastWorkspaceSlug(),
      ])

      if (cancelled) {
        return
      }

      if (error) {
        setState({
          isReady: false,
          workspaceSlug: null,
          error: error.message ?? 'Could not load workspaces',
        })
        return
      }

      const organizations = data ?? []
      const slug = pickWorkspaceSlug(organizations, lastSlug, sessionUserId)
      if (!slug) {
        setState({
          isReady: false,
          workspaceSlug: null,
          error: 'No workspace available',
        })
        return
      }

      setState({
        isReady: true,
        workspaceSlug: slug,
        error: null,
      })
    }

    loadSlug().catch(() => {
      if (!cancelled) {
        setState({
          isReady: false,
          workspaceSlug: null,
          error: 'Could not load workspace',
        })
      }
    })

    return () => {
      cancelled = true
    }
  }, [features?.workspace, featuresPending, sessionUserId])

  return state
}
