import { afterEach, describe, expect, spyOn, test } from 'bun:test'

import { db } from '@repro-v2/db'

import { http } from '@/libs/contract'

import { tasksService } from './service'

const userId = '00000000-0000-7000-8000-000000000002'
const taskId = '00000000-0000-7000-8000-000000000003'
const listId = '00000000-0000-7000-8000-000000000001'

const activeTask = {
  id: taskId,
  listId,
  title: 'Soft delete me',
  completed: false,
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  updatedAt: new Date('2026-01-01T00:00:00.000Z'),
  deletedAt: null as Date | null,
  userId,
}

describe('tasks soft delete', () => {
  afterEach(() => {
    spyOn(db, 'select').mockRestore()
    spyOn(db, 'update').mockRestore()
  })

  test('deleteTask sets deletedAt and getTaskForUser returns 404', async () => {
    let deletedAt: Date | null = null

    spyOn(db, 'select').mockImplementation(
      () =>
        ({
          from: () => ({
            innerJoin: () => ({
              where: () => ({
                limit: () => {
                  if (deletedAt) {
                    return Promise.resolve([])
                  }

                  return Promise.resolve([activeTask])
                },
              }),
            }),
            where: () => ({}),
          }),
        }) as never,
    )

    spyOn(db, 'update').mockImplementation(
      () =>
        ({
          set: (values: { deletedAt: Date; deletedById: string }) => {
            deletedAt = values.deletedAt

            return {
              where: () => ({
                returning: async () => [
                  {
                    ...activeTask,
                    deletedAt: values.deletedAt,
                    deletedById: values.deletedById,
                  },
                ],
              }),
            }
          },
        }) as never,
    )

    const deleted = await tasksService.delete(userId, taskId)

    expect(deleted.deletedAt).toBeInstanceOf(Date)
    expect(deleted.deletedById).toBe(userId)

    await expect(tasksService.getForUser(userId, taskId)).rejects.toMatchObject(
      {
        code: http.codes.NOT_FOUND,
      },
    )
  })

  test('getTaskForUser returns 404 when parent list is deleted', async () => {
    spyOn(db, 'select').mockImplementation(
      () =>
        ({
          from: () => ({
            innerJoin: () => ({
              where: () => ({
                limit: () => Promise.resolve([]),
              }),
            }),
          }),
        }) as never,
    )

    await expect(tasksService.getForUser(userId, taskId)).rejects.toMatchObject(
      {
        code: http.codes.NOT_FOUND,
      },
    )
  })

  test('getTaskForUser returns 404 for another user task', async () => {
    spyOn(db, 'select').mockImplementation(
      () =>
        ({
          from: () => ({
            innerJoin: () => ({
              where: () => ({
                limit: () => Promise.resolve([]),
              }),
            }),
          }),
        }) as never,
    )

    await expect(tasksService.getForUser(userId, taskId)).rejects.toMatchObject(
      {
        code: http.codes.NOT_FOUND,
      },
    )
  })
})
