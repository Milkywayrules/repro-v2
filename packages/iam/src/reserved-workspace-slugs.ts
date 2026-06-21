/** App routes and reserved segments — workspace slugs must not collide. */
export const RESERVED_WORKSPACE_SLUGS = new Set([
  'accept-invitation',
  'api',
  'dashboard',
  'login',
  'onboarding',
  'settings',
  'tasks',
])

export function isReservedWorkspaceSlug(slug: string): boolean {
  return RESERVED_WORKSPACE_SLUGS.has(slug.trim().toLowerCase())
}
