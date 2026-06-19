import { createWebAuthClient } from '@repro-v2/auth/client'
import { env } from '@repro-v2/env/web'

export const authClient = createWebAuthClient(env.NEXT_PUBLIC_API_URL)
