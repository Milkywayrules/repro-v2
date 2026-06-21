import 'dotenv/config'
import { createEnv } from '@t3-oss/env-core'
import { z } from 'zod'

import { booleanEnv } from './boolean-env'
import { skipEnvValidation } from './skip-env-validation'

const TRAILING_SLASH = /\/$/

function parseOriginList(value: string): string[] {
  return value
    .split(',')
    .map(part => part.trim())
    .filter(part => part.length > 0)
}

function parseCorsOrigins(value: string): [string, ...string[]] {
  return z.array(z.url()).min(1).parse(parseOriginList(value)) as [
    string,
    ...string[],
  ]
}

const iamCoordinationSchema = z
  .object({
    IAM_EMAIL_PASSWORD_ENABLED: z.boolean(),
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
    const hasAuthMethod =
      data.IAM_EMAIL_PASSWORD_ENABLED ||
      data.IAM_MAGIC_LINK_ENABLED ||
      data.IAM_GITHUB_ENABLED

    if (!hasAuthMethod) {
      ctx.addIssue({
        code: 'custom',
        path: ['IAM_EMAIL_PASSWORD_ENABLED'],
        message:
          'At least one of IAM_EMAIL_PASSWORD_ENABLED, IAM_MAGIC_LINK_ENABLED, or IAM_GITHUB_ENABLED must be true',
      })
    }

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

    if (data.IAM_CAPTCHA_ENABLED) {
      if (!data.TURNSTILE_ENABLED) {
        ctx.addIssue({
          code: 'custom',
          path: ['TURNSTILE_ENABLED'],
          message:
            'TURNSTILE_ENABLED must be true when IAM_CAPTCHA_ENABLED is true',
        })
      }

      if (!data.TURNSTILE_SECRET_KEY) {
        ctx.addIssue({
          code: 'custom',
          path: ['TURNSTILE_SECRET_KEY'],
          message:
            'TURNSTILE_SECRET_KEY is required when IAM_CAPTCHA_ENABLED is true',
        })
      }
    }
  })

export const env = createEnv({
  server: {
    // database
    DATABASE_URL: z.string().min(1),

    // iam — feature flags
    IAM_EMAIL_PASSWORD_ENABLED: booleanEnv('IAM_EMAIL_PASSWORD_ENABLED', true),
    IAM_MAGIC_LINK_ENABLED: booleanEnv('IAM_MAGIC_LINK_ENABLED', true),
    IAM_GITHUB_ENABLED: booleanEnv('IAM_GITHUB_ENABLED', true),
    IAM_WORKSPACE_ENABLED: booleanEnv('IAM_WORKSPACE_ENABLED', true),
    IAM_MULTI_SESSION_ENABLED: booleanEnv('IAM_MULTI_SESSION_ENABLED', true),
    IAM_CAPTCHA_ENABLED: booleanEnv('IAM_CAPTCHA_ENABLED', true),

    // iam — core (Better Auth)
    IAM_BETTER_AUTH_SECRET: z.string().min(32),
    IAM_BETTER_AUTH_URL: z.url(),

    // iam — github (required when IAM_GITHUB_ENABLED)
    IAM_GITHUB_CLIENT_ID: z.string().min(1).optional(),
    IAM_GITHUB_CLIENT_SECRET: z.string().min(1).optional(),

    // turnstile platform
    TURNSTILE_ENABLED: booleanEnv('TURNSTILE_ENABLED', false),
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
    OPENAPI_ENABLED: booleanEnv('OPENAPI_ENABLED', false),

    // database seeding
    ALLOW_SEED: booleanEnv('ALLOW_SEED', false),

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

    // s3 / r2 object storage
    S3_ACCOUNT_ID: z.string().min(1),
    S3_ACCESS_KEY_ID: z.string().min(1),
    S3_SECRET_ACCESS_KEY: z.string().min(1),
    S3_ENDPOINT: z
      .string()
      .url()
      .optional()
      .transform(value => value?.replace(TRAILING_SLASH, '')),
    S3_BUCKET_PUBLIC: z.string().min(1),
    S3_BUCKET_PRIVATE: z.string().min(1),
    S3_PUBLIC_BASE_URL: z
      .string()
      .url()
      .transform(value => value.replace(TRAILING_SLASH, '')),
  },
  runtimeEnv: process.env,
  skipValidation: skipEnvValidation,
  emptyStringAsUndefined: true,
})

if (!skipEnvValidation) {
  iamCoordinationSchema.parse({
    IAM_EMAIL_PASSWORD_ENABLED: env.IAM_EMAIL_PASSWORD_ENABLED,
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

/** Resolved S3 endpoint (explicit or derived from account id). */
export function resolveS3EndpointFromEnv(
  accountId = env.S3_ACCOUNT_ID,
): string {
  return env.S3_ENDPOINT ?? `https://${accountId}.r2.cloudflarestorage.com`
}

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
