import { afterEach, describe, expect, spyOn, test } from 'bun:test'

import { Elysia } from 'elysia'

import { http } from '@/libs/contract'
import { iamService } from '@/modules/iam/service'
import { workspaceService } from '@/modules/iam/workspace-service'

import { requireWorkspaceFromPath } from './require-workspace-from-path'

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
const workspaceSlug = 'test-workspace'

function createApp() {
  return new Elysia()
    .use(http.plugin())
    .use(requireWorkspaceFromPath)
    .get('/workspaces/:workspaceSlug/protected', ({ workspaceId: id }) => ({
      workspaceId: id,
      workspaceSlug,
    }))
}

function mockAuthSession(): MockAuthSession {
  return {
    user: mockUser,
    session: {
      id: 'session-1',
      userId: mockUser.id,
      expiresAt: new Date(Date.now() + 3_600_000),
      token: 'test-token',
      createdAt: new Date(),
      updatedAt: new Date(),
      activeOrganizationId: null,
    },
  } as MockAuthSession
}

describe('requireWorkspaceFromPath', () => {
  afterEach(() => {
    spyOn(iamService, 'getSession').mockRestore()
    spyOn(workspaceService, 'resolveWorkspaceIdForSlug').mockRestore()
  })

  test('returns 401 without session', async () => {
    spyOn(iamService, 'getSession').mockResolvedValue(null)

    const response = await createApp().handle(
      new Request(`http://localhost/workspaces/${workspaceSlug}/protected`),
    )

    expect(response.status).toBe(http.status.UNAUTHORIZED)
  })

  test('returns 404 when workspace slug is not found for user', async () => {
    spyOn(iamService, 'getSession').mockResolvedValue(mockAuthSession())
    spyOn(workspaceService, 'resolveWorkspaceIdForSlug').mockRejectedValue(
      http.error({
        code: http.codes.NOT_FOUND,
        message: http.messages.NOT_FOUND,
        status: http.status.NOT_FOUND,
      }),
    )

    const response = await createApp().handle(
      new Request(`http://localhost/workspaces/${workspaceSlug}/protected`),
    )

    expect(response.status).toBe(http.status.NOT_FOUND)
  })

  test('resolves workspaceId from slug for authed member', async () => {
    spyOn(iamService, 'getSession').mockResolvedValue(mockAuthSession())
    spyOn(workspaceService, 'resolveWorkspaceIdForSlug').mockResolvedValue(
      workspaceId,
    )

    const response = await createApp().handle(
      new Request(`http://localhost/workspaces/${workspaceSlug}/protected`),
    )

    expect(response.status).toBe(http.status.OK)
    expect(await response.json()).toEqual({ workspaceId, workspaceSlug })
  })
})
