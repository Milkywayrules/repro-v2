'use client'

import { useEffect, useState } from 'react'

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

  useEffect(() => {
    if (!features?.multiSession) {
      return
    }

    let cancelled = false
    setLoading(true)

    async function loadSessions() {
      try {
        const { data } = await iamClient.multiSession.listDeviceSessions()
        if (!cancelled) {
          setDeviceSessions(data ?? [])
        }
      } catch {
        if (!cancelled) {
          setDeviceSessions([])
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    loadSessions()

    return () => {
      cancelled = true
    }
  }, [features?.multiSession])

  if (!features?.multiSession) {
    return null
  }

  const activeToken = session?.session.token

  async function reloadSessions() {
    try {
      const { data } = await iamClient.multiSession.listDeviceSessions()
      setDeviceSessions(data ?? [])
    } catch {
      setDeviceSessions([])
    }
  }

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
      queryClient.invalidateQueries()
      await reloadSessions()
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
