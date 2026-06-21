import { createApiClient } from '@repro-v2/api-client'
import { env } from '@repro-v2/env/console'

export function getApiClient() {
  return createApiClient(env.NEXT_PUBLIC_API_URL)
}

/** Default client for global routes (/me, /platform). */
export const apiClient = getApiClient()
