import { afterEach, describe, expect, spyOn, test } from 'bun:test'

import { env, iamFeatures } from '@repro-v2/env/api'
import { Elysia } from 'elysia'

import { http } from '@/libs/contract'
import { notFoundError } from '@/libs/contract/errors'
import { iamService } from '@/modules/iam/service'
import { workspaceService } from '@/modules/iam/workspace-service'
import { v1Routes } from '@/routes/v1'

import { taskListsService } from './service'

const mockUser = {
  id: '00000000-0000-7000-8000-000000000001',
  name: 'Test User',
  email: 'tasks-test@example.com',
  emailVerified: true,
  createdAt: new Date(),
  updatedAt: new Date(),
  image: null,
}

const workspaceId = '00000000-0000-7000-8000-000000000099'

const mockSession = {
  id: 'session-1',
  userId: mockUser.id,
  expiresAt: new Date(Date.now() + 3_600_000),
  token: 'test-token',
  createdAt: new Date(),
  updatedAt: new Date(),
  activeOrganizationId: workspaceId,
}

const mockTaskListRow = {
  id: '00000000-0000-7000-8000-000000000001',
  name: 'Test list',
  userId: mockUser.id,
  workspaceId,
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  updatedAt: new Date('2026-01-01T00:00:00.000Z'),
  deletedAt: null as Date | null,
  createdById: mockUser.id,
  updatedById: null as string | null,
  deletedById: null as string | null,
}

function createApp() {
  return new Elysia().use(http.plugin()).use(v1Routes)
}

const workspaceSlug = 'test-workspace'

function taskListsUrl(suffix = '') {
  const base = iamFeatures.workspace
    ? `/api/v1/workspaces/${workspaceSlug}/task-lists`
    : '/api/v1/task-lists'

  return `http://localhost${base}${suffix}`
}

function mockAuthedSession(activeOrganizationId: string | null = workspaceId) {
  spyOn(iamService, 'getSession').mockResolvedValue({
    user: mockUser,
    session: {
      ...mockSession,
      activeOrganizationId,
    },
  } as NonNullable<Awaited<ReturnType<typeof iamService.getSession>>>)

  if (iamFeatures.workspace) {
    spyOn(workspaceService, 'resolveWorkspaceIdForSlug').mockResolvedValue(
      workspaceId,
    )
  } else {
    spyOn(workspaceService, 'assertMembership').mockResolvedValue(undefined)
  }
}

describe('task-lists routes', () => {
  afterEach(() => {
    spyOn(iamService, 'getSession').mockRestore()
    spyOn(workspaceService, 'resolveWorkspaceIdForSlug').mockRestore()
    spyOn(workspaceService, 'assertMembership').mockRestore()
    spyOn(taskListsService, 'list').mockRestore()
    spyOn(taskListsService, 'create').mockRestore()
    spyOn(taskListsService, 'getForUser').mockRestore()
    spyOn(taskListsService, 'update').mockRestore()
    spyOn(taskListsService, 'delete').mockRestore()
  })

  test('GET /api/v1/task-lists returns 401 without session', async () => {
    spyOn(iamService, 'getSession').mockResolvedValue(null)

    const response = await createApp().handle(new Request(taskListsUrl()))

    expect(response.status).toBe(http.status.UNAUTHORIZED)
    expect(await response.json()).toEqual({
      error: {
        code: http.codes.UNAUTHORIZED,
        message: http.messages.UNAUTHORIZED,
      },
    })
  })

  test('returns 403 or 404 when workspace access is denied', async () => {
    spyOn(iamService, 'getSession').mockResolvedValue({
      user: mockUser,
      session: {
        ...mockSession,
        activeOrganizationId: workspaceId,
      },
    } as NonNullable<Awaited<ReturnType<typeof iamService.getSession>>>)

    if (iamFeatures.workspace) {
      spyOn(workspaceService, 'resolveWorkspaceIdForSlug').mockRejectedValue(
        http.error({
          code: http.codes.NOT_FOUND,
          message: http.messages.NOT_FOUND,
          status: http.status.NOT_FOUND,
        }),
      )
    } else {
      spyOn(workspaceService, 'assertMembership').mockRejectedValue(
        http.error({
          code: http.codes.FORBIDDEN,
          message: http.messages.FORBIDDEN,
          status: http.status.FORBIDDEN,
        }),
      )
    }

    const response = await createApp().handle(new Request(taskListsUrl()))

    if (iamFeatures.workspace) {
      expect(response.status).toBe(http.status.NOT_FOUND)
    } else {
      expect(response.status).toBe(http.status.FORBIDDEN)
    }
  })

  test('GET task-lists returns 403 without active workspace when feature disabled', async () => {
    if (iamFeatures.workspace) {
      return
    }

    mockAuthedSession(null)

    const response = await createApp().handle(new Request(taskListsUrl()))

    expect(response.status).toBe(http.status.FORBIDDEN)
    expect(await response.json()).toEqual({
      error: {
        code: http.codes.FORBIDDEN,
        message: http.messages.FORBIDDEN,
      },
    })
  })

  test('GET task-lists returns 403 when user is not a workspace member', async () => {
    if (iamFeatures.workspace) {
      return
    }

    spyOn(iamService, 'getSession').mockResolvedValue({
      user: mockUser,
      session: {
        ...mockSession,
        activeOrganizationId: workspaceId,
      },
    } as NonNullable<Awaited<ReturnType<typeof iamService.getSession>>>)
    spyOn(workspaceService, 'assertMembership').mockRejectedValue(
      http.error({
        code: http.codes.FORBIDDEN,
        message: http.messages.FORBIDDEN,
        status: http.status.FORBIDDEN,
      }),
    )

    const response = await createApp().handle(new Request(taskListsUrl()))

    expect(response.status).toBe(http.status.FORBIDDEN)
    expect(await response.json()).toEqual({
      error: {
        code: http.codes.FORBIDDEN,
        message: http.messages.FORBIDDEN,
      },
    })
  })

  test('GET /api/v1/task-lists returns paginated envelope for authed user', async () => {
    mockAuthedSession()
    spyOn(taskListsService, 'list').mockResolvedValue({
      rows: [mockTaskListRow],
      total: 1,
    })

    const response = await createApp().handle(new Request(taskListsUrl()))

    expect(response.status).toBe(http.status.OK)
    const body = (await response.json()) as {
      data: unknown[]
      meta?: { apiVersion?: string; pagination?: { type: string } }
    }
    expect(body.data).toBeArray()
    expect(body.meta?.apiVersion).toBe(http.api.VERSION)
    expect(body.meta?.pagination?.type).toBe('offset')
  })

  test('GET /api/v1/task-lists returns empty envelope when user has no lists', async () => {
    mockAuthedSession()
    spyOn(taskListsService, 'list').mockResolvedValue({
      rows: [],
      total: 0,
    })

    const response = await createApp().handle(new Request(taskListsUrl()))

    expect(response.status).toBe(http.status.OK)
    const body = (await response.json()) as {
      data: unknown[]
      meta?: {
        apiVersion?: string
        pagination?: { type: string; total: number }
      }
    }
    expect(body.data).toEqual([])
    expect(body.meta?.pagination?.type).toBe('offset')
    expect(body.meta?.pagination?.total).toBe(0)
  })

  test('GET /api/v1/task-lists/:id returns 422 for invalid UUID', async () => {
    mockAuthedSession()

    const response = await createApp().handle(
      new Request(taskListsUrl('/not-a-uuid')),
    )

    expect(response.status).toBe(http.status.UNPROCESSABLE_ENTITY)
    const body = (await response.json()) as { error: { code: string } }
    expect(body.error.code).toBe(http.codes.VALIDATION_ERROR)
  })

  test('POST /api/v1/task-lists creates list for authed user', async () => {
    mockAuthedSession()
    spyOn(taskListsService, 'create').mockResolvedValue(mockTaskListRow)

    const response = await createApp().handle(
      new Request(taskListsUrl(), {
        method: 'POST',
        headers: {
          Origin: env.CORS_ORIGIN[0],
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: 'New list' }),
      }),
    )

    expect(response.status).toBe(http.status.OK)
    const body = (await response.json()) as {
      data: { id: string; name: string }
      meta?: { apiVersion?: string }
    }
    expect(body.data.id).toBe(mockTaskListRow.id)
    expect(body.data.name).toBe('Test list')
    expect(body.meta?.apiVersion).toBe(http.api.VERSION)
  })

  test('POST /api/v1/task-lists returns 422 for empty name', async () => {
    mockAuthedSession()

    const response = await createApp().handle(
      new Request(taskListsUrl(), {
        method: 'POST',
        headers: {
          Origin: env.CORS_ORIGIN[0],
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: '   ' }),
      }),
    )

    expect(response.status).toBe(http.status.UNPROCESSABLE_ENTITY)
    const body = (await response.json()) as { error: { code: string } }
    expect(body.error.code).toBe(http.codes.VALIDATION_ERROR)
  })

  test('POST /api/v1/task-lists returns 422 for empty body', async () => {
    mockAuthedSession()

    const response = await createApp().handle(
      new Request(taskListsUrl(), {
        method: 'POST',
        headers: {
          Origin: env.CORS_ORIGIN[0],
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
      }),
    )

    expect(response.status).toBe(http.status.UNPROCESSABLE_ENTITY)
    const body = (await response.json()) as { error: { code: string } }
    expect(body.error.code).toBe(http.codes.VALIDATION_ERROR)
  })

  test('PATCH /api/v1/task-lists/:id updates list for authed user', async () => {
    mockAuthedSession()
    spyOn(taskListsService, 'update').mockResolvedValue({
      ...mockTaskListRow,
      name: 'Renamed list',
    })

    const response = await createApp().handle(
      new Request(taskListsUrl(`/${mockTaskListRow.id}`), {
        method: 'PATCH',
        headers: {
          Origin: env.CORS_ORIGIN[0],
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: 'Renamed list' }),
      }),
    )

    expect(response.status).toBe(http.status.OK)
    const body = (await response.json()) as {
      data: { name: string }
    }
    expect(body.data.name).toBe('Renamed list')
  })

  test('PATCH /api/v1/task-lists/:id returns current list for empty body', async () => {
    mockAuthedSession()
    spyOn(taskListsService, 'getForUser').mockResolvedValue(mockTaskListRow)

    const response = await createApp().handle(
      new Request(taskListsUrl(`/${mockTaskListRow.id}`), {
        method: 'PATCH',
        headers: {
          Origin: env.CORS_ORIGIN[0],
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
      }),
    )

    expect(response.status).toBe(http.status.OK)
    const body = (await response.json()) as {
      data: { id: string; name: string }
    }
    expect(body.data.id).toBe(mockTaskListRow.id)
    expect(body.data.name).toBe(mockTaskListRow.name)
  })

  test('DELETE /api/v1/task-lists/:id deletes list for authed user', async () => {
    mockAuthedSession()
    spyOn(taskListsService, 'delete').mockResolvedValue({
      ...mockTaskListRow,
      deletedAt: new Date('2026-01-02T00:00:00.000Z'),
    })

    const response = await createApp().handle(
      new Request(taskListsUrl(`/${mockTaskListRow.id}`), {
        method: 'DELETE',
        headers: {
          Origin: env.CORS_ORIGIN[0],
        },
      }),
    )

    expect(response.status).toBe(http.status.OK)
    const body = (await response.json()) as {
      data: { deletedAt: string | null }
    }
    expect(body.data.deletedAt).toBeString()
  })

  test('GET /api/v1/task-lists/:id returns 404 for another user list', async () => {
    mockAuthedSession()
    spyOn(taskListsService, 'getForUser').mockRejectedValue(notFoundError())

    const response = await createApp().handle(
      new Request(taskListsUrl(`/${mockTaskListRow.id}`)),
    )

    expect(response.status).toBe(http.status.NOT_FOUND)
    expect(await response.json()).toEqual({
      error: {
        code: http.codes.NOT_FOUND,
        message: http.messages.NOT_FOUND,
      },
    })
  })

  test('POST /api/v1/task-lists rejects disallowed Origin with 403', async () => {
    const response = await createApp().handle(
      new Request(taskListsUrl(), {
        method: 'POST',
        headers: {
          Origin: 'https://evil.example',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: 'Blocked' }),
      }),
    )

    expect(response.status).toBe(http.status.FORBIDDEN)
    expect(await response.json()).toEqual({
      error: {
        code: http.codes.FORBIDDEN,
        message: http.messages.FORBIDDEN,
      },
    })
  })

  test('PATCH /api/v1/task-lists/:id rejects disallowed Origin with 403', async () => {
    const response = await createApp().handle(
      new Request(taskListsUrl(`/${mockTaskListRow.id}`), {
        method: 'PATCH',
        headers: {
          Origin: 'https://evil.example',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: 'Blocked' }),
      }),
    )

    expect(response.status).toBe(http.status.FORBIDDEN)
  })

  test('DELETE /api/v1/task-lists/:id rejects disallowed Origin with 403', async () => {
    const response = await createApp().handle(
      new Request(taskListsUrl(`/${mockTaskListRow.id}`), {
        method: 'DELETE',
        headers: {
          Origin: 'https://evil.example',
        },
      }),
    )

    expect(response.status).toBe(http.status.FORBIDDEN)
  })
})
