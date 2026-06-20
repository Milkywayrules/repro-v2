import { createEnv } from '@t3-oss/env-core'
import { z } from 'zod'

export const env = createEnv({
  clientPrefix: 'WXT_',
  client: {
    WXT_API_URL: z.url(),
    WXT_CONSOLE_URL: z.url(),
    WXT_DOCS_URL: z.url(),
    WXT_MARKETING_URL: z.url(),
  },
  runtimeEnv: import.meta.env,
  skipValidation: import.meta.env.SKIP_ENV_VALIDATION === 'true',
  emptyStringAsUndefined: true,
})
