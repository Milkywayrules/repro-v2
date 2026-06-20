import { env } from '@repro-v2/env/browser-ext'
import { createIamReactClient } from '@repro-v2/iam/react'

export const iamClient = createIamReactClient(env.WXT_API_URL)
