import { createAuthReactClient } from '@repro-v2/auth/react'
import { env } from '@repro-v2/env/browser-ext'

export const authClient = createAuthReactClient(env.WXT_API_URL)
