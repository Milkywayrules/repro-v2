import { describe, expect, test } from 'bun:test'

import { routes } from '@/lib/routes'

describe('routes', () => {
  test('includes auth and onboarding paths', () => {
    expect(routes.login).toBe('/login')
    expect(routes.dashboard).toBe('/dashboard')
    expect(routes.onboarding).toBe('/onboarding')
    expect(routes.acceptInvitation).toBe('/accept-invitation')
  })
})
