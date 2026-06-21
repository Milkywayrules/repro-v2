import { describe, expect, test } from 'bun:test'

import { routes } from '@/lib/routes'

import {
  buildOnboardingPath,
  isSafeInternalPath,
  rewriteFlatAppPath,
} from './auth-redirect'

describe('isSafeInternalPath', () => {
  test('accepts safe relative paths', () => {
    expect(isSafeInternalPath('/tasks')).toBe(true)
    expect(isSafeInternalPath('/acme/dashboard')).toBe(true)
  })

  test('rejects protocol-relative and encoded traversal', () => {
    expect(isSafeInternalPath('//evil.com')).toBe(false)
    expect(isSafeInternalPath('https://evil.com')).toBe(false)
    expect(isSafeInternalPath('/%2F%2Fevil.com')).toBe(false)
  })
})

describe('buildOnboardingPath', () => {
  test('preserves next path in query', () => {
    expect(buildOnboardingPath('/acme/tasks')).toBe(
      `${routes.onboarding}?next=${encodeURIComponent('/acme/tasks')}`,
    )
  })
})

describe('rewriteFlatAppPath', () => {
  test('rewrites flat app paths to workspace-scoped paths', () => {
    expect(rewriteFlatAppPath('/tasks', 'acme')).toBe('/acme/tasks')
    expect(rewriteFlatAppPath('/dashboard', 'acme')).toBe('/acme/dashboard')
  })

  test('leaves non-flat paths unchanged', () => {
    expect(rewriteFlatAppPath('/acme/tasks', 'acme')).toBeNull()
    expect(rewriteFlatAppPath('/login', 'acme')).toBeNull()
  })
})

describe('resolvePostAuthPath', () => {
  test('returns flat dashboard when workspace disabled', async () => {
    const { resolvePostAuthPath } = await import('./auth-redirect')
    await expect(
      resolvePostAuthPath(null, { workspace: false } as never),
    ).resolves.toBe('/dashboard')
  })
})
