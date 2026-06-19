import { env } from '@repro-v2/env/console'

export const probeHeaders = {
  'Cache-Control': 'no-store, no-cache, must-revalidate',
} as const

const API_READY_CHECK_TIMEOUT_MS = 5000

type CheckResult = { status: 'pass' } | { status: 'fail'; error: string }

export async function checkApiReady(): Promise<CheckResult> {
  try {
    const response = await fetch(`${env.NEXT_PUBLIC_API_URL}/ready`, {
      signal: AbortSignal.timeout(API_READY_CHECK_TIMEOUT_MS),
      cache: 'no-store',
    })

    if (!response.ok) {
      return {
        status: 'fail',
        error: `API readiness check returned ${response.status}`,
      }
    }

    return { status: 'pass' }
  } catch (error) {
    return {
      status: 'fail',
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}
