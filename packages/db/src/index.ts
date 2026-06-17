import { env } from '@repro-v2/env/api'
import { sql } from 'drizzle-orm'
import { drizzle } from 'drizzle-orm/node-postgres'

// biome-ignore lint/performance/noNamespaceImport: we need this for drizzle
import * as schema from './schema'

export function createDb() {
  return drizzle(env.DATABASE_URL, { schema })
}

export const db = createDb()

const DEFAULT_HEALTH_CHECK_TIMEOUT_MS = 5000

export async function checkDatabaseConnection(
  timeoutMs = DEFAULT_HEALTH_CHECK_TIMEOUT_MS,
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    await Promise.race([
      db.execute(sql`SELECT 1`),
      new Promise<never>((_, reject) => {
        setTimeout(
          () => reject(new Error('Database check timed out')),
          timeoutMs,
        )
      }),
    ])
    return { ok: true }
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}
