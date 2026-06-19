import { createAuthClient } from 'better-auth/react'

export function createWebAuthClient(baseUrl: string) {
  return createAuthClient({
    baseURL: baseUrl,
  })
}
