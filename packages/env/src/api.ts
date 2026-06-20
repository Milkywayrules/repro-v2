import 'dotenv/config'
import { createEnv } from '@t3-oss/env-core'
import { z } from 'zod'

import { booleanEnv } from './boolean-env'

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

const iamCoordinationSchema = z
  .object({
    IAM_GITHUB_ENABLED: z.boolean(),
    IAM_GITHUB_CLIENT_ID: z.string().min(1).optional(),
    IAM_GITHUB_CLIENT_SECRET: z.string().min(1).optional(),
    IAM_MAGIC_LINK_ENABLED: z.boolean(),
    EMAIL_RESEND_API_KEY: z.string().min(1).optional(),
    IAM_CAPTCHA_ENABLED: z.boolean(),
    TURNSTILE_ENABLED: z.boolean(),
    TURNSTILE_SECRET_KEY: z.string().min(1).optional(),
  })
  .superRefine((data, ctx) => {
    if (data.IAM_GITHUB_ENABLED) {
      if (!data.IAM_GITHUB_CLIENT_ID) {
        ctx.addIssue({
          code: 'custom',
          path: ['IAM_GITHUB_CLIENT_ID'],
          message:
            'IAM_GITHUB_CLIENT_ID is required when IAM_GITHUB_ENABLED is true',
        })
      }
      if (!data.IAM_GITHUB_CLIENT_SECRET) {
        ctx.addIssue({
          code: 'custom',
          path: ['IAM_GITHUB_CLIENT_SECRET'],
          message:
            'IAM_GITHUB_CLIENT_SECRET is required when IAM_GITHUB_ENABLED is true',
        })
      }
    }

    if (data.IAM_MAGIC_LINK_ENABLED && !data.EMAIL_RESEND_API_KEY) {
      ctx.addIssue({
        code: 'custom',
        path: ['EMAIL_RESEND_API_KEY'],
        message:
          'EMAIL_RESEND_API_KEY is required when IAM_MAGIC_LINK_ENABLED is true',
      })
    }

    if (
      data.TURNSTILE_ENABLED &&
      data.IAM_CAPTCHA_ENABLED &&
      !data.TURNSTILE_SECRET_KEY
    ) {
      ctx.addIssue({
        code: 'custom',
        path: ['TURNSTILE_SECRET_KEY'],
        message:
          'TURNSTILE_SECRET_KEY is required when TURNSTILE_ENABLED and IAM_CAPTCHA_ENABLED are both true',
      })
    }
  })

export const env = createEnv({
  server: {
    // database
    DATABASE_URL: z.string().min(1),

    // iam — feature flags
    IAM_EMAIL_PASSWORD_ENABLED: booleanEnv(true),
    IAM_MAGIC_LINK_ENABLED: booleanEnv(true),
    IAM_GITHUB_ENABLED: booleanEnv(true),
    IAM_WORKSPACE_ENABLED: booleanEnv(true),
    IAM_MULTI_SESSION_ENABLED: booleanEnv(true),
    IAM_CAPTCHA_ENABLED: booleanEnv(true),

    // iam — core (Better Auth)
    IAM_BETTER_AUTH_SECRET: z.string().min(32),
    IAM_BETTER_AUTH_URL: z.url(),

    // iam — github (required when IAM_GITHUB_ENABLED)
    IAM_GITHUB_CLIENT_ID: z.string().min(1).optional(),
    IAM_GITHUB_CLIENT_SECRET: z.string().min(1).optional(),

    // turnstile platform
    TURNSTILE_ENABLED: booleanEnv(false),
    TURNSTILE_SECRET_KEY: z.string().min(1).optional(),

    // email
    EMAIL_RESEND_API_KEY: z.string().min(1).optional(),

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
    OPENAPI_ENABLED: booleanEnv(false),

    // database seeding
    ALLOW_SEED: booleanEnv(false),

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

if (!process.env.SKIP_ENV_VALIDATION) {
  iamCoordinationSchema.parse({
    IAM_GITHUB_ENABLED: env.IAM_GITHUB_ENABLED,
    IAM_GITHUB_CLIENT_ID: env.IAM_GITHUB_CLIENT_ID,
    IAM_GITHUB_CLIENT_SECRET: env.IAM_GITHUB_CLIENT_SECRET,
    IAM_MAGIC_LINK_ENABLED: env.IAM_MAGIC_LINK_ENABLED,
    EMAIL_RESEND_API_KEY: env.EMAIL_RESEND_API_KEY,
    IAM_CAPTCHA_ENABLED: env.IAM_CAPTCHA_ENABLED,
    TURNSTILE_ENABLED: env.TURNSTILE_ENABLED,
    TURNSTILE_SECRET_KEY: env.TURNSTILE_SECRET_KEY,
  })
}

/** Parsed from {@link env.CORS_ORIGIN} — use for CORS and CSRF origin checks. */
export const corsOrigins = env.CORS_ORIGIN

/** MV3 extension origins trusted by Better Auth in production. */
export const extensionTrustedOrigins = env.EXTENSION_TRUSTED_ORIGINS

/** IAM feature toggles from env (defaults on unless explicitly disabled). */
export const iamFeatures = {
  emailPassword: env.IAM_EMAIL_PASSWORD_ENABLED,
  magicLink: env.IAM_MAGIC_LINK_ENABLED,
  github: env.IAM_GITHUB_ENABLED,
  workspace: env.IAM_WORKSPACE_ENABLED,
  multiSession: env.IAM_MULTI_SESSION_ENABLED,
  captcha: env.IAM_CAPTCHA_ENABLED,
} as const

/** Whether Turnstile verification is enabled at the platform level. */
export const turnstileEnabled = env.TURNSTILE_ENABLED

/**
 * Captcha is active only when IAM captcha, Turnstile, and a secret are all
 * configured.
 */
export const captchaActive =
  env.IAM_CAPTCHA_ENABLED &&
  env.TURNSTILE_ENABLED &&
  env.TURNSTILE_SECRET_KEY !== undefined
