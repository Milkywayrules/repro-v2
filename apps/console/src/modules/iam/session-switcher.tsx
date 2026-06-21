'use client'

import { useState } from 'react'
import Link from 'next/link'

import {
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@repro-v2/ui/components/dropdown-menu'
import { useQuery, useQueryClient } from '@tanstack/react-query'

import { InlineErrorCallout } from '@/components/inline-error-callout'
import { iamClient } from '@/lib/iam-client'
import { routes } from '@/lib/routes'

import { deviceSessionsQueryOptions } from './device-sessions'
import { useIamFeatures } from './use-iam-features'

export function SessionSwitcher() {
  const queryClient = useQueryClient()
  const { features } = useIamFeatures()
  const { data: session, refetch: refetchSession } = iamClient.useSession()
  const { data: deviceSessions = [], isPending: loading } = useQuery({
    ...deviceSessionsQueryOptions(),
    enabled: Boolean(features?.multiSession),
  })
  const [switchError, setSwitchError] = useState<string | null>(null)
  const [switchingToken, setSwitchingToken] = useState<string | null>(null)

  if (!features?.multiSession) {
    return null
  }

  const activeToken = session?.session.token

  async function handleSwitch(sessionToken: string) {
    if (sessionToken === activeToken || switchingToken) {
      return
    }

    setSwitchError(null)
    setSwitchingToken(sessionToken)

    try {
      const { error } = await iamClient.multiSession.setActive({ sessionToken })

      if (error) {
        setSwitchError(error.message ?? 'Could not switch session')
        return
      }

      await refetchSession()
      queryClient.clear()
    } catch {
      setSwitchError('Could not switch session')
    } finally {
      setSwitchingToken(null)
    }
  }

  return (
    <>
      <DropdownMenuSeparator />
      <DropdownMenuLabel>Sessions</DropdownMenuLabel>
      <DropdownMenuItem render={<Link href={`${routes.login}?addAccount=1`} />}>
        Add account
      </DropdownMenuItem>
      {loading ? (
        <DropdownMenuItem disabled>Loading sessions…</DropdownMenuItem>
      ) : null}
      {!loading && deviceSessions.length === 0 ? (
        <DropdownMenuItem disabled>No other sessions</DropdownMenuItem>
      ) : null}
      {switchError ? (
        <div className="px-2 py-1">
          <InlineErrorCallout className="px-2 py-1.5 text-left text-xs">
            {switchError}
          </InlineErrorCallout>
        </div>
      ) : null}
      {deviceSessions.map(deviceSession => {
        const isActive = deviceSession.session.token === activeToken
        const isSwitching =
          switchingToken === deviceSession.session.token && !isActive

        return (
          <DropdownMenuItem
            disabled={isActive || isSwitching}
            key={deviceSession.session.token}
            onClick={() => {
              handleSwitch(deviceSession.session.token)
            }}
          >
            {deviceSession.user.name} ({deviceSession.user.email})
            {isActive ? ' — active' : null}
            {isSwitching ? ' — switching…' : null}
          </DropdownMenuItem>
        )
      })}
    </>
  )
}
