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

  test('prefers owned workspace when multiple memberships match the same slug', async () => {
    spyOn(db, 'select').mockImplementation(
      () =>
        ({
          from: () => ({
            innerJoin: () => ({
              where: () =>
                Promise.resolve([
                  {
                    workspaceId: 'ws-other',
                    role: 'member',
                    ownerUserId: 'other-user',
                    slug: 'other-user:duplicate-slug',
                    metadata: null,
                    createdAt: new Date('2024-01-02T00:00:00.000Z'),
                  },
                  {
                    workspaceId,
                    role: 'owner',
                    ownerUserId: userId,
                    slug: `${userId}:duplicate-slug`,
                    metadata: null,
                    createdAt: new Date('2024-01-01T00:00:00.000Z'),
                  },
                ]),
            }),
          }),
        }) as never,
    )

    await expect(
      workspaceService.resolveWorkspaceIdForSlug(userId, 'duplicate-slug'),
    ).resolves.toBe(workspaceId)
  })

  test('picks earliest created workspace when multiple non-owned rows match the same slug', async () => {
    spyOn(db, 'select').mockImplementation(
      () =>
        ({
          from: () => ({
            innerJoin: () => ({
              where: () =>
                Promise.resolve([
                  {
                    workspaceId: 'ws-later',
                    role: 'member',
                    ownerUserId: 'other-user-b',
                    slug: 'other-user-b:duplicate-slug',
                    metadata: null,
                    createdAt: new Date('2024-02-01T00:00:00.000Z'),
                  },
                  {
                    workspaceId: 'ws-earlier',
                    role: 'member',
                    ownerUserId: 'other-user-a',
                    slug: 'other-user-a:duplicate-slug',
                    metadata: null,
                    createdAt: new Date('2024-01-01T00:00:00.000Z'),
                  },
                ]),
            }),
          }),
        }) as never,
    )

    await expect(
      workspaceService.resolveWorkspaceIdForSlug(userId, 'duplicate-slug'),
    ).resolves.toBe('ws-earlier')
  })

  test('resolves storage slug to workspace id', async () => {
    spyOn(db, 'select').mockImplementation(
      () =>
        ({
          from: () => ({
            innerJoin: () => ({
              where: () =>
                Promise.resolve([
                  {
                    workspaceId,
                    role: 'owner',
                    ownerUserId: userId,
                    slug: `${userId}:acme`,
                    metadata: JSON.stringify({ publicSlug: 'acme' }),
                    createdAt: new Date('2024-01-01T00:00:00.000Z'),
                  },
                ]),
            }),
          }),
        }) as never,
    )

    await expect(
      workspaceService.resolveWorkspaceIdForSlug(userId, 'acme'),
    ).resolves.toBe(workspaceId)
  })
})
