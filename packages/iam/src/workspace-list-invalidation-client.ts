import type { BetterAuthClientPlugin } from 'better-auth/client'

/** Refetch workspace list when the active session changes (multi-account). */
export function workspaceListInvalidationClient(): BetterAuthClientPlugin {
  return {
    id: 'workspace-list-invalidation',
    atomListeners: [
      {
        matcher(path) {
          return (
            path === '/multi-session/set-active' ||
            path === '/sign-in/email' ||
            path === '/sign-up/email'
          )
        },
        signal: '$listOrg',
      },
    ],
  }
}
