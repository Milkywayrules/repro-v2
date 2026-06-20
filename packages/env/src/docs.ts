import { createEnv } from '@t3-oss/env-nextjs'
import { z } from 'zod'

import { skipEnvValidation } from './skip-env-validation'

export const env = createEnv({
  client: {
    NEXT_PUBLIC_API_URL: z.url(),
    NEXT_PUBLIC_CONSOLE_URL: z.url(),
    NEXT_PUBLIC_DOCS_URL: z.url(),
    NEXT_PUBLIC_MARKETING_URL: z.url(),
    NEXT_PUBLIC_SHOW_INTERNAL_API_LINK: z
      .enum(['true', 'false'])
      .optional()
      .default('false')
      .transform(value => value === 'true'),
  },
  runtimeEnv: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
    NEXT_PUBLIC_CONSOLE_URL: process.env.NEXT_PUBLIC_CONSOLE_URL,
    NEXT_PUBLIC_DOCS_URL: process.env.NEXT_PUBLIC_DOCS_URL,
    NEXT_PUBLIC_MARKETING_URL: process.env.NEXT_PUBLIC_MARKETING_URL,
    NEXT_PUBLIC_SHOW_INTERNAL_API_LINK:
      process.env.NEXT_PUBLIC_SHOW_INTERNAL_API_LINK,
  },
  skipValidation: skipEnvValidation,
  emptyStringAsUndefined: true,
})
