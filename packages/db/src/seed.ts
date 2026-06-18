import dotenv from 'dotenv'
import { eq } from 'drizzle-orm'
import { z } from 'zod'

import { createDb } from './index'
import { taskLists, tasks } from './schema/tasks'

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

  const existingLists = await dbInstance
    .select({ id: taskLists.id })
    .from(taskLists)
    .where(eq(taskLists.userId, input.SEED_USER_ID))
    .limit(1)

  if (existingLists.length > 0) {
    return
  }

  const [inbox] = await dbInstance
    .insert(taskLists)
    .values({
      name: 'Inbox',
      userId: input.SEED_USER_ID,
      createdById: input.SEED_USER_ID,
    })
    .returning({ id: taskLists.id })

  if (!inbox) {
    throw new Error('Failed to seed task list')
  }

  await dbInstance.insert(tasks).values([
    {
      listId: inbox.id,
      title: 'Review API contract',
      createdById: input.SEED_USER_ID,
    },
    {
      listId: inbox.id,
      title: 'Ship tasks reference',
      completed: true,
      createdById: input.SEED_USER_ID,
    },
  ])
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
