import { afterEach, describe, expect, spyOn, test } from 'bun:test'

import { db } from '@repro-v2/db'

import { http } from '@/libs/contract'

import { deleteTaskList } from './service'

const userId = '00000000-0000-7000-8000-000000000001'
const listId = '00000000-0000-7000-8000-000000000002'

const activeList = {
  id: listId,
  name: 'Soft delete list',
  userId,
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  updatedAt: new Date('2026-01-01T00:00:00.000Z'),
  deletedAt: null as Date | null,
  createdById: userId,
  updatedById: null as string | null,
  deletedById: null as string | null,
}

describe('task-lists soft delete', () => {
  afterEach(() => {
    spyOn(db, 'select').mockRestore()
    spyOn(db, 'update').mockRestore()
    spyOn(db, 'transaction').mockRestore()
  })

  test('deleteTaskList soft-deletes child tasks before the list', async () => {
    let updateCount = 0

    spyOn(db, 'select').mockImplementation(
      () =>
        ({
          from: () => ({
            where: () => ({
              limit: () => Promise.resolve([activeList]),
            }),
          }),
        }) as never,
    )

    const updateMock = () =>
      ({
        set: () => {
          updateCount += 1
          return {
            where: () => ({
              returning: () =>
                updateCount === 2
                  ? Promise.resolve([{ ...activeList, deletedAt: new Date() }])
                  : Promise.resolve([]),
            }),
          }
        },
      }) as never

    spyOn(db, 'update').mockImplementation(updateMock)

    spyOn(db, 'transaction').mockImplementation(callback => {
      const tx = { update: updateMock }
      return callback(tx as never)
    })

    await deleteTaskList(userId, listId)

    expect(updateCount).toBe(2)
  })

  test('deleteTaskList rolls back when list update returns empty', async () => {
    let updateCount = 0

    spyOn(db, 'select').mockImplementation(
      () =>
        ({
          from: () => ({
            where: () => ({
              limit: () => Promise.resolve([activeList]),
            }),
          }),
        }) as never,
    )

    const updateMock = () =>
      ({
        set: () => {
          updateCount += 1
          return {
            where: () => ({
              returning: () =>
                updateCount === 2
                  ? Promise.resolve([])
                  : Promise.resolve([{ id: 'task-id' }]),
            }),
          }
        },
      }) as never

    spyOn(db, 'update').mockImplementation(updateMock)

    spyOn(db, 'transaction').mockImplementation(callback => {
      const tx = { update: updateMock }
      return callback(tx as never)
    })

    await expect(deleteTaskList(userId, listId)).rejects.toMatchObject({
      status: http.status.NOT_FOUND,
    })

    expect(updateCount).toBe(2)
  })
})
