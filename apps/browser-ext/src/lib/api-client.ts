import { createApiClient } from '@repro-v2/api-client'
import { env } from '@repro-v2/env/browser-ext'

export const apiClient = createApiClient(env.WXT_API_URL)
