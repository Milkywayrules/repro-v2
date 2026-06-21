'use client'

import { useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'

import { useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { InlineErrorCallout } from '@/components/inline-error-callout'
import { iamClient } from '@/lib/iam-client'

import {
  type DeviceSession,
  deviceSessionsQueryOptions,
} from './device-sessions'
import { navigateAfterSessionSwitch } from './navigate-after-session-switch'
import { useIamFeatures } from './use-iam-features'

const SESSION_INITIALS_SPLIT = /\s+/

function sessionInitials(session: DeviceSession): string {
  const source = session.user.name.trim() || session.user.email
  const parts = source.split(SESSION_INITIALS_SPLIT).filter(Boolean)

  if (parts.length >= 2) {
    return `${parts[0]?.[0] ?? ''}${parts[1]?.[0] ?? ''}`.toUpperCase()
  }

  return source.slice(0, 2).toUpperCase()
}

export function SessionChips() {
  const router = useRouter()
  const pathname = usePathname()
  const queryClient = useQueryClient()
  const { features } = useIamFeatures()
  const { data: session, refetch: refetchSession } = iamClient.useSession()
  const { data: deviceSessions = [], isPending } = useQuery({
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
        const message = error.message ?? 'Could not switch session'
        setSwitchError(message)
        toast.error(message)
        return
      }

      await refetchSession()
      queryClient.clear()
      await navigateAfterSessionSwitch(router, pathname)
    } catch {
      const message = 'Could not switch session'
      setSwitchError(message)
      toast.error(message)
    } finally {
      setSwitchingToken(null)
    }
  }

  if (isPending && deviceSessions.length === 0) {
    return null
  }

  return (
    <div className="flex items-center gap-1">
      <span className="sr-only">Signed-in sessions</span>
      {switchError ? (
        <InlineErrorCallout className="max-w-48 px-2 py-1 text-left text-xs">
          {switchError}
        </InlineErrorCallout>
      ) : null}
      {deviceSessions.map(deviceSession => {
        const isActive = deviceSession.session.token === activeToken
        const isSwitching =
          switchingToken === deviceSession.session.token && !isActive
        const label = `${deviceSession.user.name} (${deviceSession.user.email})`

        return (
          <button
            aria-current={isActive ? 'true' : undefined}
            aria-label={label}
            className={`flex size-8 items-center justify-center rounded-full border text-xs ${
              isActive
                ? 'border-primary bg-primary text-primary-foreground'
                : 'border-border bg-muted text-muted-foreground'
            }`}
            disabled={isSwitching}
            key={deviceSession.session.token}
            onClick={() => {
              handleSwitch(deviceSession.session.token).catch(() => undefined)
            }}
            title={label}
            type="button"
          >
            {sessionInitials(deviceSession)}
          </button>
        )
      })}
    </div>
  )
}
