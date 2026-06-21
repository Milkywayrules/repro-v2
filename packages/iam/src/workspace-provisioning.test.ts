import { afterEach, describe, expect, mock, test } from 'bun:test'

import type { Db } from '@repro-v2/db'

const baseIamFeatures = {
  emailPassword: true,
  magicLink: false,
  github: false,
  workspace: true,
  multiSession: true,
  captcha: false,
} as const

function createMockDb(membershipCount: number): Db {
  return {
    select: () => ({
      from: () => ({
        where: () =>
          Promise.resolve(
            Array.from({ length: membershipCount }, (_, index) => ({
              id: `membership-${index}`,
            })),
          ),
      }),
    }),
  } as unknown as Db
}

async function runHook(options: {
  membershipCount: number
  nodeEnv: 'development' | 'production'
  workspaceEnabled: boolean
}) {
  let seeded = false

  mock.module('@repro-v2/env/api', () => ({
    env: {
      NODE_ENV: options.nodeEnv,
    },
    iamFeatures: {
      ...baseIamFeatures,
      workspace: options.workspaceEnabled,
    },
  }))

  mock.module('@repro-v2/db/seed-tasks-for-user', () => ({
    seedDefaultTasksForUser: (
      _db: unknown,
      userId: string,
      workspaceId: string,
    ) => {
      expect(userId).toBe('user-1')
      expect(workspaceId).toBe('org-1')
      seeded = true
      return Promise.resolve(true)
    },
  }))

  const { createDemoSeedOnFirstWorkspaceHook } = await import(
    './workspace-provisioning'
  )

  const hook = createDemoSeedOnFirstWorkspaceHook(
    createMockDb(options.membershipCount),
  )

  await hook({
    organization: { id: 'org-1' },
    user: { id: 'user-1' },
  })

  return seeded
}

afterEach(() => {
  mock.restore()
})

describe('createDemoSeedOnFirstWorkspaceHook', () => {
  test('seeds demo tasks in development when user has exactly one membership', async () => {
    const seeded = await runHook({
      nodeEnv: 'development',
      workspaceEnabled: true,
      membershipCount: 1,
    })

    expect(seeded).toBe(true)
  })

  test('skips when not in development', async () => {
    const seeded = await runHook({
      nodeEnv: 'production',
      workspaceEnabled: true,
      membershipCount: 1,
    })

    expect(seeded).toBe(false)
  })

  test('skips when user has more than one membership', async () => {
    const seeded = await runHook({
      nodeEnv: 'development',
      workspaceEnabled: true,
      membershipCount: 2,
    })

    expect(seeded).toBe(false)
  })

  test('skips when workspace feature is disabled', async () => {
    const seeded = await runHook({
      nodeEnv: 'development',
      workspaceEnabled: false,
      membershipCount: 1,
    })

    expect(seeded).toBe(false)
  })
})
