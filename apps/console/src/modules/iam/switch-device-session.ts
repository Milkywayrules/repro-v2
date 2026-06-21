'use client'

import type { QueryClient } from '@tanstack/react-query'
import type { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime'

import { iamClient } from '@/lib/iam-client'

import { navigateAfterSessionSwitch } from './navigate-after-session-switch'

export type SwitchDeviceSessionResult =
  | { ok: true }
  | { ok: false; error: string }

export async function switchDeviceSession(
  sessionToken: string,
  options: {
    pathname: string
    queryClient: QueryClient
    refetchSession: () => Promise<unknown>
    router: AppRouterInstance
  },
): Promise<SwitchDeviceSessionResult> {
  const { error } = await iamClient.multiSession.setActive({ sessionToken })

  if (error) {
    return { ok: false, error: error.message ?? 'Could not switch session' }
  }

  await options.refetchSession()
  options.queryClient.clear()
  await navigateAfterSessionSwitch(options.router, options.pathname)
  return { ok: true }
}
