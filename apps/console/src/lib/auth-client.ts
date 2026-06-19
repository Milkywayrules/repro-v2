import { createAuthReactClient } from '@repro-v2/auth/react'
import { env } from '@repro-v2/env/web'

export const authClient = createAuthReactClient(env.NEXT_PUBLIC_API_URL)
