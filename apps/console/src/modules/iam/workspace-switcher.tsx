'use client'

import { useState } from 'react'

import {
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@repro-v2/ui/components/dropdown-menu'
import { useQueryClient } from '@tanstack/react-query'

import { iamClient } from '@/lib/iam-client'

import { useIamFeatures } from './use-iam-features'

export function WorkspaceSwitcher() {
  const queryClient = useQueryClient()
  const { features } = useIamFeatures()
  const { data: session, refetch: refetchSession } = iamClient.useSession()
  const { data: organizations, isPending: orgsPending } =
    iamClient.useListOrganizations()
  const [switchError, setSwitchError] = useState<string | null>(null)
  const [switchingId, setSwitchingId] = useState<string | null>(null)

  if (!features?.workspace) {
    return null
  }

  const orgList = organizations ?? []
  if (orgsPending || orgList.length === 0) {
    return null
  }

  const activeOrganizationId =
    session?.session &&
    'activeOrganizationId' in session.session &&
    typeof session.session.activeOrganizationId === 'string'
      ? session.session.activeOrganizationId
      : null

  async function handleSwitch(organizationId: string) {
    if (organizationId === activeOrganizationId || switchingId) {
      return
    }

    setSwitchError(null)
    setSwitchingId(organizationId)

    try {
      const { error } = await iamClient.organization.setActive({
        organizationId,
      })

      if (error) {
        setSwitchError(error.message ?? 'Could not switch workspace')
        return
      }

      await refetchSession()
      queryClient.clear()
    } catch {
      setSwitchError('Could not switch workspace')
    } finally {
      setSwitchingId(null)
    }
  }

  return (
    <>
      <DropdownMenuSeparator />
      <DropdownMenuLabel>Workspaces</DropdownMenuLabel>
      {switchError ? (
        <DropdownMenuLabel
          aria-live="assertive"
          className="font-normal text-destructive text-sm"
          role="alert"
        >
          {switchError}
        </DropdownMenuLabel>
      ) : null}
      {orgList.map(org => {
        const isActive = org.id === activeOrganizationId
        const isSwitching = switchingId === org.id && !isActive

        return (
          <DropdownMenuItem
            disabled={isActive || isSwitching}
            key={org.id}
            onClick={() => {
              handleSwitch(org.id)
            }}
          >
            {org.name}
            {isActive ? ' — active' : null}
            {isSwitching ? ' — switching…' : null}
          </DropdownMenuItem>
        )
      })}
    </>
  )
}
