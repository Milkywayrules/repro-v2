import type { Db } from '@repro-v2/db'
import { createId } from '@repro-v2/db/id'
// biome-ignore lint/performance/noNamespaceImport: we need this for auth
import * as schema from '@repro-v2/db/schema/auth'
import { corsOrigins, env } from '@repro-v2/env/api'
import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'

/** MV3 extension popups call Better Auth with a dynamic extension origin. */
const extensionTrustedOrigins = [
  'chrome-extension://*',
  'moz-extension://*',
] as const

export function createAuth(db: Db) {
  return betterAuth({
    database: drizzleAdapter(db, {
      provider: 'pg',

      schema,
    }),
    trustedOrigins: [...corsOrigins, ...extensionTrustedOrigins],
    emailAndPassword: {
      enabled: true,
    },
    secret: env.BETTER_AUTH_SECRET,
    baseURL: env.BETTER_AUTH_URL,
    advanced: {
      database: { generateId: () => createId() },
      defaultCookieAttributes: {
        sameSite: 'none',
        secure: true,
        httpOnly: true,
      },
    },
    plugins: [],
  })
}
