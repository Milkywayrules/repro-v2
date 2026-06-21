'use client'

import { useEffect } from 'react'
import { notFound, useParams } from 'next/navigation'

import { isReservedWorkspaceSlug } from '@repro-v2/iam/reserved-workspace-slugs'

import { writeLastWorkspaceSlug } from '@/lib/last-workspace-cookie'

export function useWorkspaceSlugParam(): string {
  const params = useParams<{ workspace: string }>()
  const workspaceSlug = params.workspace

  if (!workspaceSlug || isReservedWorkspaceSlug(workspaceSlug)) {
    notFound()
  }

  return workspaceSlug
}

export function useTrackLastWorkspaceSlug(workspaceSlug: string) {
  useEffect(() => {
    writeLastWorkspaceSlug(workspaceSlug)
  }, [workspaceSlug])
}
