import { describe, expect, test } from 'bun:test'

import type { createDb } from './index'
import { runSeed } from './seed'

const seedUserId = '00000000-0000-7000-8000-000000000001'

const baseSeedEnv = {
  DATABASE_URL: 'postgres://localhost:5432/test',
  SEED_USER_ID: seedUserId,
  NODE_ENV: 'development' as const,
  ALLOW_SEED: false,
}

function createMockDb(existingListIds: string[] = []) {
  let insertCalled = false

  const mockDb = {
    select: () => ({
      from: () => ({
        where: () => ({
          limit: () => Promise.resolve(existingListIds.map(id => ({ id }))),
        }),
      }),
    }),
    insert: () => {
      insertCalled = true
      return {
        values: () => ({
          returning: () => Promise.resolve([{ id: 'new-list-id' }]),
        }),
      }
    },
  }

  return {
    db: mockDb as unknown as ReturnType<typeof createDb>,
    wasInsertCalled: () => insertCalled,
  }
}

describe('runSeed', () => {
  test('refuses production without ALLOW_SEED', async () => {
    const { db } = createMockDb()

    await expect(
      runSeed(
        {
          ...baseSeedEnv,
          NODE_ENV: 'production',
          ALLOW_SEED: false,
        },
        db,
      ),
    ).rejects.toThrow(
      'Refusing to seed production database without ALLOW_SEED=true',
    )
  })

  test('skips insert when user already has lists', async () => {
    const { db, wasInsertCalled } = createMockDb(['existing-list-id'])

    await runSeed(baseSeedEnv, db)

    expect(wasInsertCalled()).toBe(false)
  })
})
