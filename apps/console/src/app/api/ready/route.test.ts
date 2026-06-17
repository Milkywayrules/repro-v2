import { env } from '@repro-v2/env/web'

import { GET } from './route'
import { beforeAll, describe, expect, test } from 'bun:test'

let apiRunning = false

beforeAll(async () => {
  try {
    const response = await fetch(`${env.NEXT_PUBLIC_API_URL}/health`, {
      signal: AbortSignal.timeout(2000),
      cache: 'no-store',
    })
    apiRunning = response.ok
  } catch {
    apiRunning = false
  }
})

describe('GET /api/ready', () => {
  test('returns ready when API is healthy', async () => {
    if (!apiRunning) {
      if (process.env.CI) {
        throw new Error(
          `API not reachable at ${env.NEXT_PUBLIC_API_URL} during CI`,
        )
      }
      return
    }

    const response = await GET()

    expect(response.status).toBe(200)

    const body = await response.json()
    expect(body).toEqual({
      status: 'ready',
      checks: {
        api: { status: 'pass' },
      },
    })
  })
})
