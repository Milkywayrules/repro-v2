import { describe, expect, test } from 'bun:test'

import type { ApiClient } from '../index'
import {
  healthQueryOptions,
  platformKeys,
  type ReadyProbe,
  readyQueryOptions,
  rootQueryOptions,
} from './platform'

describe('platformKeys', () => {
  test('builds hierarchical keys', () => {
    expect(platformKeys.all).toEqual(['platform'])
    expect(platformKeys.health()).toEqual(['platform', 'health'])
    expect(platformKeys.root()).toEqual(['platform', 'root'])
    expect(platformKeys.ready()).toEqual(['platform', 'ready'])
  })
})

describe('platform query options', () => {
  test('use probe defaults', () => {
    const client = {} as ApiClient

    expect(healthQueryOptions(client).retry).toBe(false)
    expect(healthQueryOptions(client).staleTime).toBe(30_000)
    expect(rootQueryOptions(client).retry).toBe(false)
    expect(readyQueryOptions(client).retry).toBe(false)
  })

  test('readyQueryOptions returns not_ready from 503 treaty error body', async () => {
    const client = {
      ready: {
        get: async () => ({
          data: null,
          error: {
            status: 503,
            value: {
              status: 'not_ready',
              checks: { database: { status: 'fail', error: 'down' } },
            },
          },
        }),
      },
    } as unknown as ApiClient

    const queryFn = readyQueryOptions(client).queryFn
    expect(queryFn).toBeDefined()
    const result = await (queryFn as () => Promise<ReadyProbe>)()
    expect(result).toEqual({
      status: 'not_ready',
      checks: { database: { status: 'fail', error: 'down' } },
    })
  })
})
