import { describe, expect, test } from 'bun:test'

import { Elysia } from 'elysia'

import { http } from '@/libs/contract'
import { v1Routes } from '@/routes/v1'

import { iamFeaturesService } from './service'

function createApp() {
  return new Elysia().use(http.plugin()).use(v1Routes)
}

describe('GET /api/v1/platform/iam-features', () => {
  test('returns public okV1 envelope without session', async () => {
    const response = await createApp().handle(
      new Request('http://localhost/api/v1/platform/iam-features'),
    )

    expect(response.status).toBe(http.status.OK)

    const body = await response.json()
    expect(body).toEqual({
      data: iamFeaturesService.getPublicFeatures(),
      meta: { apiVersion: http.api.VERSION },
    })
  })

  test('exposes only boolean feature flags', async () => {
    const response = await createApp().handle(
      new Request('http://localhost/api/v1/platform/iam-features'),
    )

    const { data } = (await response.json()) as {
      data: Record<string, unknown>
    }

    for (const value of Object.values(data)) {
      expect(typeof value).toBe('boolean')
    }
  })
})
