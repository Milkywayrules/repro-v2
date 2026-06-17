import { env } from '@repro-v2/env/api'
import { drizzle } from 'drizzle-orm/node-postgres'

// biome-ignore lint/performance/noNamespaceImport: we need this for drizzle
import * as schema from './schema'

export function createDb() {
  return drizzle(env.DATABASE_URL, { schema })
}

export const db = createDb()
