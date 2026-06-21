import type { Db } from '@repro-v2/db'
import { createId } from '@repro-v2/db/id'
// biome-ignore lint/performance/noNamespaceImport: drizzle adapter expects schema namespace
import * as schema from '@repro-v2/db/schema/auth'
import {
  corsOrigins,
  env,
  extensionTrustedOrigins,
  iamFeatures,
} from '@repro-v2/env/api'
import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'

import { createIamEmailHandlers } from './email-hooks'
import { buildIamPlugins } from './plugins'
import { buildSocialProviders } from './social-providers'

const devExtensionTrustedOrigins = [
  'chrome-extension://*',
  'moz-extension://*',
] as const

function iamTrustedOrigins(): string[] {
  if (env.NODE_ENV !== 'production') {
    return [...corsOrigins, ...devExtensionTrustedOrigins]
  }

  return [...corsOrigins, ...extensionTrustedOrigins]
}

export function createIam(db: Db) {
  const email = createIamEmailHandlers()
  const plugins = buildIamPlugins(db, email)

  return betterAuth({
    database: drizzleAdapter(db, {
      provider: 'pg',
      schema,
    }),
    trustedOrigins: iamTrustedOrigins(),
    emailAndPassword: {
      enabled: iamFeatures.emailPassword,
      ...(email
        ? {
            sendResetPassword: async ({ user, url }) => {
              await email.sendResetPassword({ user, url })
            },
          }
        : {}),
    },
    ...(email
      ? {
          emailVerification: {
            sendOnSignUp: true,
            sendVerificationEmail: async ({ user, url }) => {
              await email.sendVerificationEmail({ user, url })
            },
          },
        }
      : {}),
    socialProviders: buildSocialProviders(),
    secret: env.IAM_BETTER_AUTH_SECRET,
    baseURL: env.IAM_BETTER_AUTH_URL,
    advanced: {
      database: { generateId: () => createId() },
      defaultCookieAttributes: {
        sameSite: 'none',
        secure: true,
        httpOnly: true,
      },
    },
    plugins,
  })
}

export type { IamEmailHandlers } from './email-hooks'
