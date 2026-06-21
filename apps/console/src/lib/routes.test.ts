import { describe, expect, test } from 'bun:test'

import {
  parseWorkspaceFromPathname,
  routes,
  workspaceRoutes,
  workspaceSubPathFromPathname,
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

  test('workspaceSubPathFromPathname preserves flat app routes', () => {
    expect(workspaceSubPathFromPathname('/tasks')).toBe('tasks')
    expect(workspaceSubPathFromPathname('/settings')).toBe('settings')
    expect(workspaceSubPathFromPathname('/dashboard')).toBe('dashboard')
    expect(workspaceSubPathFromPathname('/acme/tasks')).toBe('tasks')
    expect(workspaceSubPathFromPathname('/acme')).toBe('dashboard')
  })
})
