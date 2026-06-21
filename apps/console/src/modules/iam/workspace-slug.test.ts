import { describe, expect, test } from 'bun:test'

import { workspaceSlugFromName } from './workspace-slug'

describe('workspaceSlugFromName', () => {
  test('slugifies workspace names', () => {
    expect(workspaceSlugFromName('Acme Inc')).toBe('acme-inc')
  })

  test('falls back when name has no slug characters', () => {
    expect(workspaceSlugFromName('!!!')).toBe('workspace')
  })

  test('avoids reserved route slugs', () => {
    expect(workspaceSlugFromName('Login')).toBe('login-ws')
  })
})
