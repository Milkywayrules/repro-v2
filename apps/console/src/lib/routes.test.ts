import { describe, expect, test } from 'bun:test'

import {
  parseWorkspaceFromPathname,
  routes,
  workspaceRoutes,
} from '@/lib/routes'

describe('routes', () => {
  test('includes auth and onboarding paths', () => {
    expect(routes.login).toBe('/login')
    expect(routes.onboarding).toBe('/onboarding')
    expect(routes.acceptInvitation).toBe('/accept-invitation')
  })

  test('builds workspace-scoped paths', () => {
    expect(workspaceRoutes('acme').dashboard).toBe('/acme/dashboard')
    expect(workspaceRoutes('acme').tasks).toBe('/acme/tasks')
  })

  test('parseWorkspaceFromPathname ignores reserved segments', () => {
    expect(parseWorkspaceFromPathname('/dashboard')).toBeNull()
    expect(parseWorkspaceFromPathname('/login')).toBeNull()
    expect(parseWorkspaceFromPathname('/acme/dashboard')).toBe('acme')
  })
})
