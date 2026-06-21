'use client'

import { usePathname } from 'next/navigation'

import { readLastWorkspaceSlug } from '@/lib/last-workspace-cookie'
import { parseWorkspaceFromPathname } from '@/lib/routes'
import { useIamFeatures } from '@/modules/iam/use-iam-features'

/** Workspace slug from the URL, or last-used cookie when on a non-workspace route. */
export function useEffectiveWorkspaceSlug(): string | null {
  const pathname = usePathname()
  const { features } = useIamFeatures()

  if (!features?.workspace) {
    return null
  }

  return parseWorkspaceFromPathname(pathname) ?? readLastWorkspaceSlug()
}
