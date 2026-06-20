import {
  magicLinkClient,
  multiSessionClient,
  organizationClient,
} from 'better-auth/client/plugins'
import { createAuthClient } from 'better-auth/react'

export function createIamReactClient(baseUrl: string) {
  return createAuthClient({
    baseURL: baseUrl,
    plugins: [magicLinkClient(), multiSessionClient(), organizationClient()],
  })
}
