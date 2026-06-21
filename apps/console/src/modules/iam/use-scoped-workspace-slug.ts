'use client'

import { useParams } from 'next/navigation'

import { isReservedWorkspaceSlug } from '@repro-v2/iam/reserved-workspace-slugs'

import { useIamFeatures } from '@/modules/iam/use-iam-features'

/** Workspace slug for scoped API calls — undefined when workspace feature is off. */
export function useScopedWorkspaceSlug(): string | undefined {
  const { features } = useIamFeatures()
  const params = useParams<{ workspace?: string }>()
  const slug = params.workspace

  if (!(features?.workspace && slug) || isReservedWorkspaceSlug(slug)) {
    return
  }

  return slug
}
