import { describe, expect, test } from 'bun:test'

import { platformKeys } from './platform'

describe('platformKeys', () => {
  test('builds hierarchical keys', () => {
    expect(platformKeys.all).toEqual(['platform'])
    expect(platformKeys.health()).toEqual(['platform', 'health'])
    expect(platformKeys.root()).toEqual(['platform', 'root'])
    expect(platformKeys.ready()).toEqual(['platform', 'ready'])
  })
})
