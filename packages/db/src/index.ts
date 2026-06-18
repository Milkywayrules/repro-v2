import { env } from '@repro-v2/env/api'
import { sql } from 'drizzle-orm'
import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'

// biome-ignore lint/performance/noNamespaceImport: we need this for drizzle
import * as schema from './schema/auth'

const pool = new Pool({ connectionString: env.DATABASE_URL })

export function createDb() {
  return drizzle(pool, { schema })
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

export async function closeDatabaseConnection(): Promise<void> {
  await pool.end()
}
