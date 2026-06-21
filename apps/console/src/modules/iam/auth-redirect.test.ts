import { describe, expect, test } from 'bun:test'

import { routes } from '@/lib/routes'

import {
  buildOnboardingPath,
  isSafeInternalPath,
  resolvePostAuthPath,
} from './auth-redirect'

describe('isSafeInternalPath', () => {
  test('allows single-leading-slash paths', () => {
    expect(isSafeInternalPath('/dashboard')).toBe(true)
    expect(isSafeInternalPath('/tasks/123')).toBe(true)
  })

  test('rejects protocol-relative paths', () => {
    expect(isSafeInternalPath('//evil.com')).toBe(false)
    expect(isSafeInternalPath('//evil.com/path')).toBe(false)
  })

  test('rejects external and relative paths', () => {
    expect(isSafeInternalPath('https://evil.com')).toBe(false)
    expect(isSafeInternalPath('dashboard')).toBe(false)
    expect(isSafeInternalPath('')).toBe(false)
  })

  test('rejects backslash and encoded open-redirect patterns', () => {
    expect(isSafeInternalPath('/path\\evil')).toBe(false)
    expect(isSafeInternalPath('/%2F%2Fevil.com')).toBe(false)
    expect(isSafeInternalPath('/%2f%2fevil.com')).toBe(false)
    expect(isSafeInternalPath('/%5Cevil')).toBe(false)
  })
})

describe('resolvePostAuthPath', () => {
  test('uses safe internal next paths', () => {
    expect(resolvePostAuthPath('/tasks')).toBe('/tasks')
  })

  test('rejects open redirects', () => {
    expect(resolvePostAuthPath('//evil.com')).toBe(routes.dashboard)
    expect(resolvePostAuthPath('https://evil.com')).toBe(routes.dashboard)
    expect(resolvePostAuthPath('/%2F%2Fevil.com')).toBe(routes.dashboard)
  })

  test('falls back to dashboard', () => {
    expect(resolvePostAuthPath(null)).toBe(routes.dashboard)
    expect(resolvePostAuthPath(undefined)).toBe(routes.dashboard)
    expect(resolvePostAuthPath('')).toBe(routes.dashboard)
  })
})

describe('buildOnboardingPath', () => {
  test('preserves safe next query param', () => {
    expect(buildOnboardingPath('/tasks')).toBe('/onboarding?next=%2Ftasks')
  })

  test('omits next for unsafe paths', () => {
    expect(buildOnboardingPath('//evil.com')).toBe(routes.onboarding)
  })
})
