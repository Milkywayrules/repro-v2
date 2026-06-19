import { createAuthClient } from 'better-auth/react'

export function createAuthReactClient(baseUrl: string) {
  return createAuthClient({
    baseURL: baseUrl,
  })
}
