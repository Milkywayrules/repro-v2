'use client'

import { usePathname } from 'next/navigation'

import { iamClient } from '@/lib/iam-client'
import { parseWorkspaceFromPathname } from '@/lib/routes'

import {
  mapOrganizationsToWorkspaces,
  pickSlugFromWorkspaces,
} from './list-workspaces'
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

  const workspaces = mapOrganizationsToWorkspaces(organizations)

  return pickSlugFromWorkspaces(workspaces)
}
