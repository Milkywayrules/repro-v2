import type { BetterAuthClientPlugin } from 'better-auth/client'

const WORKSPACE_LIST_INVALIDATION_PATHS = new Set([
  '/multi-session/set-active',
  '/sign-in/email',
  '/sign-up/email',
])

/** Refetch workspace list when the active session changes (multi-account). */
export function workspaceListInvalidationClient(): BetterAuthClientPlugin {
  return {
    id: 'workspace-list-invalidation',
    atomListeners: [
      {
        matcher(path) {
          return WORKSPACE_LIST_INVALIDATION_PATHS.has(path)
        },
        signal: '$listOrg',
      },
    ],
  }
}
