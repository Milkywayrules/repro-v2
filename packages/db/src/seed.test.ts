import { describe, expect, test } from 'bun:test'

import type { createDb } from './index'
import { runSeed } from './seed'

const seedUserId = '00000000-0000-7000-8000-000000000001'
const workspaceId = '00000000-0000-7000-8000-000000000099'

const baseSeedEnv = {
  DATABASE_URL: 'postgres://localhost:5432/test',
  SEED_USER_ID: seedUserId,
  NODE_ENV: 'development' as const,
  ALLOW_SEED: false,
}

function createMockDb(
  options: { existingMembership?: boolean; existingListIds?: string[] } = {},
) {
  let insertCalled = false
  let selectCalls = 0

  const mockDb = {
    select: () => ({
      from: () => ({
        where: () => ({
          limit: () => {
            selectCalls += 1

            if (selectCalls === 1) {
              return Promise.resolve(
                options.existingMembership ? [{ workspaceId }] : [],
              )
            }

            return Promise.resolve(
              (options.existingListIds ?? []).map(id => ({ id })),
            )
          },
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

  test('skips task insert when user already has lists', async () => {
    const { db, wasInsertCalled } = createMockDb({
      existingMembership: true,
      existingListIds: ['existing-list-id'],
    })

    await runSeed(baseSeedEnv, db)

    expect(wasInsertCalled()).toBe(false)
  })

  test('creates workspace and tasks when user has no membership or lists', async () => {
    const { db, wasInsertCalled } = createMockDb()

    await runSeed(baseSeedEnv, db)

    expect(wasInsertCalled()).toBe(true)
  })

  test('throws when SEED_WORKSPACE_ID is set but user is not a member', async () => {
    const { db } = createMockDb()

    await expect(
      runSeed(
        {
          ...baseSeedEnv,
          SEED_WORKSPACE_ID: '00000000-0000-7000-8000-000000000088',
        },
        db,
      ),
    ).rejects.toThrow(
      'SEED_WORKSPACE_ID 00000000-0000-7000-8000-000000000088 is not a workspace the user belongs to',
    )
  })
})
