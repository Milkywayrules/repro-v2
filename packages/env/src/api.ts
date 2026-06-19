import 'dotenv/config'
import { createEnv } from '@t3-oss/env-core'
import { z } from 'zod'

export const env = createEnv({
  server: {
    // database
    DATABASE_URL: z.string().min(1),

    // better-auth
    BETTER_AUTH_SECRET: z.string().min(32),
    BETTER_AUTH_URL: z.url(),
    CORS_ORIGIN: z.url(),

    // node environment
    NODE_ENV: z
      .enum(['development', 'production', 'test'])
      .default('development'),

    // openapi
    OPENAPI_ENABLED: z
      .enum(['true', 'false'])
      .optional()
      .default('false')
      .transform(value => value === 'true'),

    // database seeding
    ALLOW_SEED: z
      .enum(['true', 'false'])
      .optional()
      .default('false')
      .transform(value => value === 'true'),

    // rate limiting
    RATE_LIMIT_AUTH_MAX: z.coerce.number().int().positive().default(15),
    RATE_LIMIT_AUTH_DURATION_MS: z.coerce
      .number()
      .int()
      .positive()
      .default(60_000),
    RATE_LIMIT_GLOBAL_MAX: z.coerce.number().int().positive().default(200),
    RATE_LIMIT_GLOBAL_DURATION_MS: z.coerce
      .number()
      .int()
      .positive()
      .default(60_000),
    RATE_LIMIT_DEV_MULTIPLIER: z.coerce.number().int().positive().default(10),
  },
  runtimeEnv: process.env,
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
  emptyStringAsUndefined: true,
})
