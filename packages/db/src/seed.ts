import dotenv from 'dotenv'
import { z } from 'zod'

import { createDb } from './index'
import { seedDefaultTasksForUser } from './seed-tasks-for-user'

dotenv.config({ path: '../../apps/api/.env' })

const seedEnv = z.object({
  DATABASE_URL: z.string().min(1),
  SEED_USER_ID: z.uuid(),
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .optional()
    .default('development'),
  ALLOW_SEED: z
    .enum(['true', 'false'])
    .optional()
    .default('false')
    .transform(value => value === 'true'),
})

export type SeedEnv = z.infer<typeof seedEnv>

export async function runSeed(
  input: SeedEnv,
  dbInstance: ReturnType<typeof createDb> = createDb(),
) {
  if (input.NODE_ENV === 'production' && !input.ALLOW_SEED) {
    throw new Error(
      'Refusing to seed production database without ALLOW_SEED=true',
    )
  }

  await seedDefaultTasksForUser(dbInstance, input.SEED_USER_ID)
}

async function seed() {
  const env = seedEnv.parse(process.env)
  await runSeed(env)
}

if (import.meta.main) {
  seed()
    .then(() => {
      process.exit(0)
    })
    .catch(error => {
      process.stderr.write(
        `${error instanceof Error ? error.message : 'Seed failed'}\n`,
      )
      process.exit(1)
    })
}
