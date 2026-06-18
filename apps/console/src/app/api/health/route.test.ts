import { describe, expect, test } from 'bun:test'

import { GET } from './route'

describe('GET /api/health', () => {
  test('returns 200 with ok status', async () => {
    const response = GET()

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({ status: 'ok' })
    expect(response.headers.get('cache-control')).toBe(
      'no-store, no-cache, must-revalidate',
    )
  })
})
