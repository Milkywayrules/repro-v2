import 'dotenv/config'
import { createEnv } from '@t3-oss/env-core'
import { z } from 'zod'

function parseOriginList(value: string): string[] {
  return value
    .split(',')
    .map(part => part.trim())
    .filter(part => part.length > 0)
}

function parseCorsOrigins(value: string): [string, ...string[]] {
  const origins = value
    .split(',')
    .map(part => part.trim())
    .filter(part => part.length > 0)

  return z.array(z.url()).min(1).parse(origins) as [string, ...string[]]
}

export const env = createEnv({
  server: {
    // database
    DATABASE_URL: z.string().min(1),

    // better-auth
    BETTER_AUTH_SECRET: z.string().min(32),
    BETTER_AUTH_URL: z.url(),
    /** Comma-separated allowed browser origins (console, marketing, docs, …). */
    CORS_ORIGIN: z.string().min(1).transform(parseCorsOrigins),

    /** Comma-separated MV3 extension origins for production (e.g. chrome-extension://id). */
    EXTENSION_TRUSTED_ORIGINS: z
      .string()
      .optional()
      .transform(value => (value ? parseOriginList(value) : [])),

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

/** Parsed from {@link env.CORS_ORIGIN} — use for CORS and CSRF origin checks. */
export const corsOrigins = env.CORS_ORIGIN

/** MV3 extension origins trusted by Better Auth in production. */
export const extensionTrustedOrigins = env.EXTENSION_TRUSTED_ORIGINS
