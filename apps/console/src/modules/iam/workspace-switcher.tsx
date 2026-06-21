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

import { mapOrganizationsToWorkspaces } from './list-workspaces'
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

  const workspaces = mapOrganizationsToWorkspaces(organizations)
  if (orgsPending || workspaces.length === 0) {
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
      {workspaces.map(workspace => {
        const isActive = workspace.slug === activeSlug
        const org = organizations?.find(item => item.id === workspace.id)

        return (
          <DropdownMenuItem
            aria-current={isActive ? 'true' : undefined}
            disabled={isActive}
            key={workspace.id}
            onClick={() => {
              handleSwitch(workspace.slug)
            }}
          >
            {typeof org?.name === 'string' ? org.name : workspace.slug}
            {isActive ? ' — current' : null}
          </DropdownMenuItem>
        )
      })}
    </>
  )
}
