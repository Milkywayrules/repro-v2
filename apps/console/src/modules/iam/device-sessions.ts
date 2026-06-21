'use client'

import { deviceSessionKeys } from '@repro-v2/api-client/queries'

import { iamClient } from '@/lib/iam-client'

interface DeviceSession {
  session: {
    token: string
  }
  user: {
    email: string
    name: string
    image?: string | null
  }
}

export async function fetchDeviceSessions(): Promise<DeviceSession[]> {
  try {
    const { data } = await iamClient.multiSession.listDeviceSessions()
    return data ?? []
  } catch {
    return []
  }
}

export function deviceSessionsQueryOptions() {
  return {
    queryKey: deviceSessionKeys.list(),
    queryFn: fetchDeviceSessions,
  }
}

export type { DeviceSession }
