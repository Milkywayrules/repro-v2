import { afterEach, describe, expect, spyOn, test } from 'bun:test'

import { env } from '@repro-v2/env/api'
import { Elysia } from 'elysia'

import { http } from '@/libs/contract'
import { notFoundError } from '@/libs/contract/errors'
import { iamService } from '@/modules/iam/service'
import { workspaceService } from '@/modules/iam/workspace-service'
import { v1Routes } from '@/routes/v1'

import { tasksService } from './service'

const mockUser = {
  id: '00000000-0000-7000-8000-000000000002',
  name: 'Task User',
  email: 'task-user@example.com',
  emailVerified: true,
  createdAt: new Date(),
  updatedAt: new Date(),
  image: null,
}

const workspaceId = '00000000-0000-7000-8000-000000000099'

const mockSession = {
  id: 'session-2',
  userId: mockUser.id,
  expiresAt: new Date(Date.now() + 3_600_000),
  token: 'test-token',
  createdAt: new Date(),
  updatedAt: new Date(),
  activeOrganizationId: workspaceId,
}

const mockTaskRow = {
  id: '00000000-0000-7000-8000-000000000010',
  listId: '00000000-0000-7000-8000-000000000001',
  workspaceId,
  title: 'Test task',
  completed: false,
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

function mockAuthedSession(activeOrganizationId: string | null = workspaceId) {
  spyOn(iamService, 'getSession').mockResolvedValue({
    user: mockUser,
    session: {
      ...mockSession,
      activeOrganizationId,
    },
  } as NonNullable<Awaited<ReturnType<typeof iamService.getSession>>>)
  spyOn(workspaceService, 'assertMembership').mockResolvedValue(undefined)
}

describe('tasks routes', () => {
  afterEach(() => {
    spyOn(iamService, 'getSession').mockRestore()
    spyOn(workspaceService, 'assertMembership').mockRestore()
    spyOn(tasksService, 'list').mockRestore()
    spyOn(tasksService, 'create').mockRestore()
    spyOn(tasksService, 'getForUser').mockRestore()
    spyOn(tasksService, 'update').mockRestore()
    spyOn(tasksService, 'delete').mockRestore()
  })

  test('GET /api/v1/tasks returns 401 without session', async () => {
    spyOn(iamService, 'getSession').mockResolvedValue(null)

    const response = await createApp().handle(
      new Request('http://localhost/api/v1/tasks'),
    )

    expect(response.status).toBe(http.status.UNAUTHORIZED)
    expect(await response.json()).toEqual({
      error: {
        code: http.codes.UNAUTHORIZED,
        message: http.messages.UNAUTHORIZED,
      },
    })
  })

  test('GET /api/v1/tasks returns 403 without active workspace', async () => {
    mockAuthedSession(null)

    const response = await createApp().handle(
      new Request('http://localhost/api/v1/tasks'),
    )

    expect(response.status).toBe(http.status.FORBIDDEN)
    expect(await response.json()).toEqual({
      error: {
        code: http.codes.FORBIDDEN,
        message: http.messages.FORBIDDEN,
      },
    })
  })

  test('GET /api/v1/tasks returns paginated envelope for authed user', async () => {
    mockAuthedSession()
    spyOn(tasksService, 'list').mockResolvedValue({
      rows: [mockTaskRow],
      total: 1,
    })

    const response = await createApp().handle(
      new Request('http://localhost/api/v1/tasks'),
    )

    expect(response.status).toBe(http.status.OK)
    const body = (await response.json()) as {
      data: unknown[]
      meta?: { apiVersion?: string; pagination?: { type: string } }
    }
    expect(body.data).toBeArray()
    expect(body.meta?.apiVersion).toBe(http.api.VERSION)
    expect(body.meta?.pagination?.type).toBe('offset')
  })

  test('GET /api/v1/tasks returns empty envelope when user has no tasks', async () => {
    mockAuthedSession()
    spyOn(tasksService, 'list').mockResolvedValue({
      rows: [],
      total: 0,
    })

    const response = await createApp().handle(
      new Request('http://localhost/api/v1/tasks'),
    )

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

  test('GET /api/v1/tasks?page=0 returns 422', async () => {
    mockAuthedSession()

    const response = await createApp().handle(
      new Request('http://localhost/api/v1/tasks?page=0'),
    )

    expect(response.status).toBe(http.status.UNPROCESSABLE_ENTITY)
    const body = (await response.json()) as { error: { code: string } }
    expect(body.error.code).toBe(http.codes.VALIDATION_ERROR)
  })

  test('GET /api/v1/tasks?listId=not-a-uuid returns 422', async () => {
    mockAuthedSession()

    const response = await createApp().handle(
      new Request('http://localhost/api/v1/tasks?listId=not-a-uuid'),
    )

    expect(response.status).toBe(http.status.UNPROCESSABLE_ENTITY)
    const body = (await response.json()) as { error: { code: string } }
    expect(body.error.code).toBe(http.codes.VALIDATION_ERROR)
  })

  test('GET /api/v1/tasks/:id returns 422 for invalid UUID', async () => {
    mockAuthedSession()

    const response = await createApp().handle(
      new Request('http://localhost/api/v1/tasks/not-a-uuid'),
    )

    expect(response.status).toBe(http.status.UNPROCESSABLE_ENTITY)
    const body = (await response.json()) as { error: { code: string } }
    expect(body.error.code).toBe(http.codes.VALIDATION_ERROR)
  })

  test('POST /api/v1/tasks creates task for authed user', async () => {
    mockAuthedSession()
    spyOn(tasksService, 'create').mockResolvedValue(mockTaskRow)

    const response = await createApp().handle(
      new Request('http://localhost/api/v1/tasks', {
        method: 'POST',
        headers: {
          Origin: env.CORS_ORIGIN[0],
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: 'Test task',
          listId: mockTaskRow.listId,
        }),
      }),
    )

    expect(response.status).toBe(http.status.OK)
    const body = (await response.json()) as {
      data: { id: string; title: string }
      meta?: { apiVersion?: string }
    }
    expect(body.data.id).toBe(mockTaskRow.id)
    expect(body.data.title).toBe('Test task')
    expect(body.meta?.apiVersion).toBe(http.api.VERSION)
  })

  test('POST /api/v1/tasks returns 422 for empty title', async () => {
    mockAuthedSession()

    const response = await createApp().handle(
      new Request('http://localhost/api/v1/tasks', {
        method: 'POST',
        headers: {
          Origin: env.CORS_ORIGIN[0],
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: '   ',
          listId: mockTaskRow.listId,
        }),
      }),
    )

    expect(response.status).toBe(http.status.UNPROCESSABLE_ENTITY)
    const body = (await response.json()) as { error: { code: string } }
    expect(body.error.code).toBe(http.codes.VALIDATION_ERROR)
  })

  test('POST /api/v1/tasks returns 422 for empty body', async () => {
    mockAuthedSession()

    const response = await createApp().handle(
      new Request('http://localhost/api/v1/tasks', {
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

  test('POST /api/v1/tasks returns 422 for title exceeding max length', async () => {
    mockAuthedSession()

    const response = await createApp().handle(
      new Request('http://localhost/api/v1/tasks', {
        method: 'POST',
        headers: {
          Origin: env.CORS_ORIGIN[0],
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: 'a'.repeat(501),
          listId: mockTaskRow.listId,
        }),
      }),
    )

    expect(response.status).toBe(http.status.UNPROCESSABLE_ENTITY)
    const body = (await response.json()) as { error: { code: string } }
    expect(body.error.code).toBe(http.codes.VALIDATION_ERROR)
  })

  test('POST /api/v1/tasks returns 404 for deleted listId', async () => {
    mockAuthedSession()
    spyOn(tasksService, 'create').mockRejectedValue(notFoundError())

    const response = await createApp().handle(
      new Request('http://localhost/api/v1/tasks', {
        method: 'POST',
        headers: {
          Origin: env.CORS_ORIGIN[0],
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: 'Orphan task',
          listId: mockTaskRow.listId,
        }),
      }),
    )

    expect(response.status).toBe(http.status.NOT_FOUND)
    expect(await response.json()).toEqual({
      error: {
        code: http.codes.NOT_FOUND,
        message: http.messages.NOT_FOUND,
      },
    })
  })

  test('GET /api/v1/tasks?listId returns 404 for foreign listId', async () => {
    mockAuthedSession()
    spyOn(tasksService, 'list').mockRejectedValue(notFoundError())

    const response = await createApp().handle(
      new Request(
        'http://localhost/api/v1/tasks?listId=00000000-0000-7000-8000-000000000099',
      ),
    )

    expect(response.status).toBe(http.status.NOT_FOUND)
    expect(await response.json()).toEqual({
      error: {
        code: http.codes.NOT_FOUND,
        message: http.messages.NOT_FOUND,
      },
    })
  })

  test('PATCH /api/v1/tasks/:id updates task for authed user', async () => {
    mockAuthedSession()
    spyOn(tasksService, 'update').mockResolvedValue({
      ...mockTaskRow,
      completed: true,
    })

    const response = await createApp().handle(
      new Request(`http://localhost/api/v1/tasks/${mockTaskRow.id}`, {
        method: 'PATCH',
        headers: {
          Origin: env.CORS_ORIGIN[0],
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ completed: true }),
      }),
    )

    expect(response.status).toBe(http.status.OK)
    const body = (await response.json()) as {
      data: { completed: boolean }
    }
    expect(body.data.completed).toBe(true)
  })

  test('PATCH /api/v1/tasks/:id returns current task for empty body', async () => {
    mockAuthedSession()
    spyOn(tasksService, 'getForUser').mockResolvedValue(mockTaskRow)

    const response = await createApp().handle(
      new Request(`http://localhost/api/v1/tasks/${mockTaskRow.id}`, {
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
      data: { id: string; title: string; completed: boolean }
    }
    expect(body.data.id).toBe(mockTaskRow.id)
    expect(body.data.title).toBe(mockTaskRow.title)
    expect(body.data.completed).toBe(false)
  })

  test('DELETE /api/v1/tasks/:id deletes task for authed user', async () => {
    mockAuthedSession()
    spyOn(tasksService, 'delete').mockResolvedValue({
      ...mockTaskRow,
      deletedAt: new Date('2026-01-02T00:00:00.000Z'),
    })

    const response = await createApp().handle(
      new Request(`http://localhost/api/v1/tasks/${mockTaskRow.id}`, {
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

  test('GET /api/v1/tasks/:id returns 404 for another user task', async () => {
    mockAuthedSession()
    spyOn(tasksService, 'getForUser').mockRejectedValue(notFoundError())

    const response = await createApp().handle(
      new Request(`http://localhost/api/v1/tasks/${mockTaskRow.id}`),
    )

    expect(response.status).toBe(http.status.NOT_FOUND)
    expect(await response.json()).toEqual({
      error: {
        code: http.codes.NOT_FOUND,
        message: http.messages.NOT_FOUND,
      },
    })
  })

  test('POST /api/v1/tasks rejects disallowed Origin with 403', async () => {
    const response = await createApp().handle(
      new Request('http://localhost/api/v1/tasks', {
        method: 'POST',
        headers: {
          Origin: 'https://evil.example',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: 'Blocked',
          listId: mockTaskRow.listId,
        }),
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

  test('PATCH /api/v1/tasks/:id rejects disallowed Origin with 403', async () => {
    const response = await createApp().handle(
      new Request(`http://localhost/api/v1/tasks/${mockTaskRow.id}`, {
        method: 'PATCH',
        headers: {
          Origin: 'https://evil.example',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ completed: true }),
      }),
    )

    expect(response.status).toBe(http.status.FORBIDDEN)
  })

  test('DELETE /api/v1/tasks/:id rejects disallowed Origin with 403', async () => {
    const response = await createApp().handle(
      new Request(`http://localhost/api/v1/tasks/${mockTaskRow.id}`, {
        method: 'DELETE',
        headers: {
          Origin: 'https://evil.example',
        },
      }),
    )

    expect(response.status).toBe(http.status.FORBIDDEN)
  })
})
