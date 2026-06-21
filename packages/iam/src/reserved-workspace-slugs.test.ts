import { describe, expect, test } from 'bun:test'

import {
  isReservedWorkspaceSlug,
  RESERVED_WORKSPACE_SLUGS,
} from './reserved-workspace-slugs'

describe('reserved workspace slugs', () => {
  test('blocks app route collisions', () => {
    expect(RESERVED_WORKSPACE_SLUGS.has('login')).toBe(true)
    expect(RESERVED_WORKSPACE_SLUGS.has('dashboard')).toBe(true)
    expect(isReservedWorkspaceSlug('LOGIN')).toBe(true)
    expect(isReservedWorkspaceSlug('acme-inc')).toBe(false)
  })
})
