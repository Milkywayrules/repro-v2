import { afterEach, describe, expect, spyOn, test } from 'bun:test'

import { Elysia } from 'elysia'

import { http } from '@/libs/contract'
import { iamService } from '@/modules/iam/service'
import { workspaceService } from '@/modules/iam/workspace-service'

import { requireActiveWorkspace } from './require-active-workspace'

type MockAuthSession = NonNullable<
  Awaited<ReturnType<typeof iamService.getSession>>
>

const mockUser = {
  id: '00000000-0000-7000-8000-000000000001',
  name: 'Workspace User',
  email: 'workspace-user@example.com',
  emailVerified: true,
  createdAt: new Date(),
  updatedAt: new Date(),
  image: null,
}

const workspaceId = '00000000-0000-7000-8000-000000000010'

function createApp() {
  return new Elysia()
    .use(http.plugin())
    .use(requireActiveWorkspace)
    .get('/protected', ({ workspaceId: activeWorkspaceId }) => ({
      workspaceId: activeWorkspaceId,
    }))
}

function mockAuthSession(activeOrganizationId: string | null): MockAuthSession {
  return {
    user: mockUser,
    session: {
      id: 'session-1',
      userId: mockUser.id,
      expiresAt: new Date(Date.now() + 3_600_000),
      token: 'test-token',
      createdAt: new Date(),
      updatedAt: new Date(),
      activeOrganizationId,
    },
  } as MockAuthSession
}

describe('requireActiveWorkspace', () => {
  afterEach(() => {
    spyOn(iamService, 'getSession').mockRestore()
    spyOn(workspaceService, 'assertMembership').mockRestore()
  })

  test('returns 401 without session', async () => {
    spyOn(iamService, 'getSession').mockResolvedValue(null)

    const response = await createApp().handle(
      new Request('http://localhost/protected'),
    )

    expect(response.status).toBe(http.status.UNAUTHORIZED)
  })

  test('returns 403 when session has no active workspace', async () => {
    spyOn(iamService, 'getSession').mockResolvedValue(mockAuthSession(null))

    const response = await createApp().handle(
      new Request('http://localhost/protected'),
    )

    expect(response.status).toBe(http.status.FORBIDDEN)
    expect(await response.json()).toEqual({
      error: {
        code: http.codes.FORBIDDEN,
        message: http.messages.FORBIDDEN,
      },
    })
  })

  test('returns 403 when user is not a workspace member', async () => {
    spyOn(iamService, 'getSession').mockResolvedValue(
      mockAuthSession(workspaceId),
    )
    spyOn(workspaceService, 'assertMembership').mockRejectedValue(
      http.error({
        code: http.codes.FORBIDDEN,
        message: http.messages.FORBIDDEN,
        status: http.status.FORBIDDEN,
      }),
    )

    const response = await createApp().handle(
      new Request('http://localhost/protected'),
    )

    expect(response.status).toBe(http.status.FORBIDDEN)
  })

  test('resolves workspaceId for authed member', async () => {
    spyOn(iamService, 'getSession').mockResolvedValue(
      mockAuthSession(workspaceId),
    )
    spyOn(workspaceService, 'assertMembership').mockResolvedValue(undefined)

    const response = await createApp().handle(
      new Request('http://localhost/protected'),
    )

    expect(response.status).toBe(http.status.OK)
    expect(await response.json()).toEqual({ workspaceId })
  })
})
