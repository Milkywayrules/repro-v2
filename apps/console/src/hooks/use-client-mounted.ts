import { useSyncExternalStore } from 'react'

function subscribe() {
  return () => {
    /* no-op: snapshot is static after mount */
  }
}

/** Avoid SSR/client mismatch for auth and browser-only state. */
export function useClientMounted() {
  return useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  )
}
