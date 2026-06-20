'use client'

import { useCallback, useEffect, useState } from 'react'

import {
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@repro-v2/ui/components/dropdown-menu'
import { useQueryClient } from '@tanstack/react-query'

import { iamClient } from '@/lib/iam-client'

import { useIamFeatures } from './use-iam-features'

interface DeviceSession {
  session: {
    token: string
  }
  user: {
    email: string
    name: string
  }
}

export function SessionSwitcher() {
  const queryClient = useQueryClient()
  const { features } = useIamFeatures()
  const { data: session, refetch: refetchSession } = iamClient.useSession()
  const [deviceSessions, setDeviceSessions] = useState<DeviceSession[]>([])
  const [loading, setLoading] = useState(false)
  const [switchError, setSwitchError] = useState<string | null>(null)
  const [switchingToken, setSwitchingToken] = useState<string | null>(null)

  const loadSessions = useCallback(async () => {
    if (!features?.multiSession) {
      return
    }

    setLoading(true)

    const { data } = await iamClient.multiSession.listDeviceSessions()
    setDeviceSessions(data ?? [])
    setLoading(false)
  }, [features?.multiSession])

  useEffect(() => {
    loadSessions().catch(() => {
      setLoading(false)
    })
  }, [loadSessions])

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

    const { error } = await iamClient.multiSession.setActive({ sessionToken })

    setSwitchingToken(null)

    if (error) {
      setSwitchError(error.message ?? 'Could not switch session')
      return
    }

    await refetchSession()
    queryClient.invalidateQueries()
    await loadSessions()
  }

  return (
    <>
      <DropdownMenuSeparator />
      <DropdownMenuLabel>Sessions</DropdownMenuLabel>
      {loading ? (
        <DropdownMenuItem disabled>Loading sessions…</DropdownMenuItem>
      ) : null}
      {!loading && deviceSessions.length === 0 ? (
        <DropdownMenuItem disabled>No other sessions</DropdownMenuItem>
      ) : null}
      {switchError ? (
        <DropdownMenuItem aria-live="polite" disabled role="alert">
          {switchError}
        </DropdownMenuItem>
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
              handleSwitch(deviceSession.session.token).catch(() => {
                setSwitchingToken(null)
              })
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
