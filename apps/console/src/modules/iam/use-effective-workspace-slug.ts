'use client'

import { usePathname } from 'next/navigation'

import { iamClient } from '@/lib/iam-client'
import { parseWorkspaceFromPathname } from '@/lib/routes'

import { pickSlugFromWorkspaces } from './list-workspaces'
import { useIamFeatures } from './use-iam-features'

/** Workspace slug from the URL, or last-used cookie when on a non-workspace route. */
export function useEffectiveWorkspaceSlug(): string | null {
  const pathname = usePathname()
  const { features } = useIamFeatures()
  const { data: organizations } = iamClient.useListOrganizations()

  if (!features?.workspace) {
    return null
  }

  const fromPath = parseWorkspaceFromPathname(pathname)
  if (fromPath) {
    return fromPath
  }

  const workspaces =
    organizations?.flatMap(org => {
      if (typeof org.slug !== 'string') {
        return []
      }

      return [{ id: org.id, slug: org.slug }]
    }) ?? []

  return pickSlugFromWorkspaces(workspaces)
}
