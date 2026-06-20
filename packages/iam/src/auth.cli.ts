import { db } from '@repro-v2/db'

import { createIam } from './index'

/** Better Auth CLI entry — `bunx @better-auth/cli generate --config packages/iam/src/auth.cli.ts` */
export const auth = createIam(db)
