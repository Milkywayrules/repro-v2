import { env } from '@repro-v2/env/console'
import { createIamReactClient } from '@repro-v2/iam/react'

export const iamClient = createIamReactClient(env.NEXT_PUBLIC_API_URL)
