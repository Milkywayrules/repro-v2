import { afterEach, describe, expect, spyOn, test } from 'bun:test'

import { db } from '@repro-v2/db'

import { http } from '@/libs/contract'

import { workspaceService } from './workspace-service'

const userId = '00000000-0000-7000-8000-000000000001'
const workspaceId = '00000000-0000-7000-8000-000000000099'

describe('workspaceService.assertMembership', () => {
  afterEach(() => {
    spyOn(db, 'select').mockRestore()
  })

  test('passes when membership exists', async () => {
    spyOn(db, 'select').mockImplementation(
      () =>
        ({
          from: () => ({
            where: () => ({
              limit: () => Promise.resolve([{ id: 'member-id' }]),
            }),
          }),
        }) as never,
    )

    await expect(
      workspaceService.assertMembership(userId, workspaceId),
    ).resolves.toBeUndefined()
  })

  test('throws 403 when membership is missing', async () => {
    spyOn(db, 'select').mockImplementation(
      () =>
        ({
          from: () => ({
            where: () => ({
              limit: () => Promise.resolve([]),
            }),
          }),
        }) as never,
    )

    await expect(
      workspaceService.assertMembership(userId, workspaceId),
    ).rejects.toMatchObject({
      code: http.codes.FORBIDDEN,
      status: http.status.FORBIDDEN,
    })
  })
})

describe('workspaceService.resolveWorkspaceIdForSlug', () => {
  afterEach(() => {
    spyOn(db, 'select').mockRestore()
  })

  test('throws 409 when multiple memberships match the same slug', async () => {
    spyOn(db, 'select').mockImplementation(
      () =>
        ({
          from: () => ({
            innerJoin: () => ({
              where: () =>
                Promise.resolve([
                  {
                    workspaceId: 'ws-1',
                    role: 'owner',
                    ownerUserId: userId,
                  },
                  {
                    workspaceId: 'ws-2',
                    role: 'member',
                    ownerUserId: 'other-user',
                  },
                ]),
            }),
          }),
        }) as never,
    )

    await expect(
      workspaceService.resolveWorkspaceIdForSlug(userId, 'duplicate-slug'),
    ).rejects.toMatchObject({
      code: http.codes.CONFLICT,
      status: http.status.CONFLICT,
    })
  })
})
