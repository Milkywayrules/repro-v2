import { describe, expect, test } from 'bun:test'

import type { createDb } from './index'
import { seedDefaultTasksForUser } from './seed-tasks-for-user'

describe('seedDefaultTasksForUser', () => {
  test('inserts inbox and tasks when user has no lists', async () => {
    let insertCalls = 0

    const mockDb = {
      select: () => ({
        from: () => ({
          where: () => ({
            limit: () => Promise.resolve([]),
          }),
        }),
      }),
      insert: () => {
        insertCalls += 1
        return {
          values: () => ({
            returning: () => Promise.resolve([{ id: 'list-id' }]),
          }),
        }
      },
    }

    const seeded = await seedDefaultTasksForUser(
      mockDb as unknown as ReturnType<typeof createDb>,
      'user-id',
    )

    expect(seeded).toBe(true)
    expect(insertCalls).toBe(2)
  })

  test('skips when user already has lists', async () => {
    let insertCalled = false

    const mockDb = {
      select: () => ({
        from: () => ({
          where: () => ({
            limit: () => Promise.resolve([{ id: 'existing-list' }]),
          }),
        }),
      }),
      insert: () => {
        insertCalled = true
        return {
          values: () => ({
            returning: () => Promise.resolve([{ id: 'list-id' }]),
          }),
        }
      },
    }

    const seeded = await seedDefaultTasksForUser(
      mockDb as unknown as ReturnType<typeof createDb>,
      'user-id',
    )

    expect(seeded).toBe(false)
    expect(insertCalled).toBe(false)
  })
})
