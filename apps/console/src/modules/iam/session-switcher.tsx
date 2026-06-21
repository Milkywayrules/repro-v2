'use client'

import { useEffect, useState } from 'react'

import {
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@repro-v2/ui/components/dropdown-menu'
import { useQueryClient } from '@tanstack/react-query'

import { InlineErrorCallout } from '@/components/inline-error-callout'
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

async function listDeviceSessions(): Promise<DeviceSession[]> {
  try {
    const { data } = await iamClient.multiSession.listDeviceSessions()
    return data ?? []
  } catch {
    return []
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
        const sessions = await listDeviceSessions()
        if (!cancelled) {
          setDeviceSessions(sessions)
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
    setDeviceSessions(await listDeviceSessions())
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
      queryClient.clear()
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
