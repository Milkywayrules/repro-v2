'use client'

import type { Route } from 'next'
import { usePathname, useRouter } from 'next/navigation'

import {
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@repro-v2/ui/components/dropdown-menu'

import { iamClient } from '@/lib/iam-client'
import {
  parseWorkspaceFromPathname,
  workspaceSubPathFromPathname,
} from '@/lib/routes'

import { useIamFeatures } from './use-iam-features'

export function WorkspaceSwitcher() {
  const router = useRouter()
  const pathname = usePathname()
  const { features } = useIamFeatures()
  const { data: organizations, isPending: orgsPending } =
    iamClient.useListOrganizations()

  if (!features?.workspace) {
    return null
  }

  const orgList = organizations ?? []
  if (orgsPending || orgList.length === 0) {
    return null
  }

  const activeSlug = parseWorkspaceFromPathname(pathname)
  const subPath = workspaceSubPathFromPathname(pathname)

  function handleSwitch(slug: string) {
    if (slug === activeSlug) {
      return
    }

    router.push(`/${slug}/${subPath}` as Route)
  }

  return (
    <>
      <DropdownMenuSeparator />
      <DropdownMenuLabel>Workspaces</DropdownMenuLabel>
      {orgList.map(org => {
        const isActive = org.slug === activeSlug

        return (
          <DropdownMenuItem
            aria-current={isActive ? 'true' : undefined}
            disabled={isActive}
            key={org.id}
            onClick={() => {
              handleSwitch(org.slug)
            }}
          >
            {org.name}
            {isActive ? ' — current' : null}
          </DropdownMenuItem>
        )
      })}
    </>
  )
}
