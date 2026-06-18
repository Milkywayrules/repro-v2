import { describe, expect, test } from 'bun:test'

import { createApiClient } from './index'

describe('createApiClient', () => {
  test('returns treaty client with api namespace', () => {
    const client = createApiClient('http://localhost:5000')

    expect(client.api).toBeDefined()
    expect(client.api.v1).toBeDefined()
    expect(client.api.v1.tasks).toBeDefined()
    expect(client.api.v1['task-lists']).toBeDefined()
  })
})
