import { afterEach, describe, expect, spyOn, test } from 'bun:test'

import { env } from '@repro-v2/env/api'
import { Elysia } from 'elysia'

import { http } from '@/libs/contract'
import { notFoundError } from '@/libs/contract/errors'
import { iamService } from '@/modules/iam/service'
import { workspaceService } from '@/modules/iam/workspace-service'
import { v1Routes } from '@/routes/v1'

import { attachmentsService } from './attachments-service'

const mockUser = {
  id: '00000000-0000-7000-8000-000000000002',
  name: 'Attachment User',
  email: 'attachment-user@example.com',
  emailVerified: true,
  createdAt: new Date(),
  updatedAt: new Date(),
  image: null,
}

const workspaceId = '00000000-0000-7000-8000-000000000099'
const taskId = '00000000-0000-7000-8000-000000000010'
const attachmentId = '00000000-0000-7000-8000-000000000020'

const mockSession = {
  id: 'session-attach',
  userId: mockUser.id,
  expiresAt: new Date(Date.now() + 3_600_000),
  token: 'test-token',
  createdAt: new Date(),
  updatedAt: new Date(),
  activeOrganizationId: workspaceId,
}

const mockAttachmentRow = {
  id: attachmentId,
  taskId,
  workspaceId,
  storageKey: `attachments/${workspaceId}/${taskId}/file.pdf`,
  filename: 'file.pdf',
  contentType: 'application/pdf',
  sizeBytes: 1024,
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

describe('task attachment routes', () => {
  afterEach(() => {
    spyOn(iamService, 'getSession').mockRestore()
    spyOn(workspaceService, 'assertMembership').mockRestore()
    spyOn(attachmentsService, 'listForTask').mockRestore()
    spyOn(attachmentsService, 'presignUpload').mockRestore()
    spyOn(attachmentsService, 'completeUpload').mockRestore()
    spyOn(attachmentsService, 'presignDownload').mockRestore()
    spyOn(attachmentsService, 'delete').mockRestore()
  })

  test('GET /api/v1/tasks/:taskId/attachments returns 403 without workspace', async () => {
    mockAuthedSession(null)

    const response = await createApp().handle(
      new Request(`http://localhost/api/v1/tasks/${taskId}/attachments`),
    )

    expect(response.status).toBe(http.status.FORBIDDEN)
  })

  test('GET /api/v1/tasks/:taskId/attachments lists attachments', async () => {
    mockAuthedSession()
    spyOn(attachmentsService, 'listForTask').mockResolvedValue([
      mockAttachmentRow,
    ])

    const response = await createApp().handle(
      new Request(`http://localhost/api/v1/tasks/${taskId}/attachments`),
    )

    expect(response.status).toBe(http.status.OK)
    const body = (await response.json()) as { data: { id: string }[] }
    expect(body.data).toHaveLength(1)
    expect(body.data[0]?.id).toBe(attachmentId)
  })

  test('POST /api/v1/tasks/:taskId/attachments/presign returns upload URL', async () => {
    mockAuthedSession()
    spyOn(attachmentsService, 'presignUpload').mockResolvedValue({
      uploadUrl: 'https://s3.example/upload',
      key: mockAttachmentRow.storageKey,
      expiresAt: '2026-01-01T00:05:00.000Z',
    })

    const response = await createApp().handle(
      new Request(
        `http://localhost/api/v1/tasks/${taskId}/attachments/presign`,
        {
          method: 'POST',
          headers: {
            Origin: env.CORS_ORIGIN[0],
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            filename: 'file.pdf',
            contentType: 'application/pdf',
            sizeBytes: 1024,
          }),
        },
      ),
    )

    expect(response.status).toBe(http.status.OK)
    const body = (await response.json()) as {
      data: { uploadUrl: string; key: string }
    }
    expect(body.data.uploadUrl).toContain('https://')
  })

  test('POST /api/v1/tasks/:taskId/attachments/complete returns attachment', async () => {
    mockAuthedSession()
    spyOn(attachmentsService, 'completeUpload').mockResolvedValue(
      mockAttachmentRow,
    )

    const response = await createApp().handle(
      new Request(
        `http://localhost/api/v1/tasks/${taskId}/attachments/complete`,
        {
          method: 'POST',
          headers: {
            Origin: env.CORS_ORIGIN[0],
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            key: mockAttachmentRow.storageKey,
            filename: 'file.pdf',
            contentType: 'application/pdf',
            sizeBytes: 1024,
          }),
        },
      ),
    )

    expect(response.status).toBe(http.status.OK)
    const body = (await response.json()) as { data: { filename: string } }
    expect(body.data.filename).toBe('file.pdf')
  })

  test('GET download returns presigned URL', async () => {
    mockAuthedSession()
    spyOn(attachmentsService, 'presignDownload').mockResolvedValue({
      downloadUrl: 'https://s3.example/download',
    })

    const response = await createApp().handle(
      new Request(
        `http://localhost/api/v1/tasks/${taskId}/attachments/${attachmentId}/download`,
      ),
    )

    expect(response.status).toBe(http.status.OK)
    const body = (await response.json()) as { data: { downloadUrl: string } }
    expect(body.data.downloadUrl).toContain('https://')
  })

  test('DELETE attachment returns soft-deleted row', async () => {
    mockAuthedSession()
    spyOn(attachmentsService, 'delete').mockResolvedValue({
      ...mockAttachmentRow,
      deletedAt: new Date('2026-01-02T00:00:00.000Z'),
    })

    const response = await createApp().handle(
      new Request(
        `http://localhost/api/v1/tasks/${taskId}/attachments/${attachmentId}`,
        {
          method: 'DELETE',
          headers: {
            Origin: env.CORS_ORIGIN[0],
          },
        },
      ),
    )

    expect(response.status).toBe(http.status.OK)
    const body = (await response.json()) as {
      data: { deletedAt: string | null }
    }
    expect(body.data.deletedAt).toBeString()
  })

  test('GET attachments returns 404 when task missing', async () => {
    mockAuthedSession()
    spyOn(attachmentsService, 'listForTask').mockRejectedValue(notFoundError())

    const response = await createApp().handle(
      new Request(`http://localhost/api/v1/tasks/${taskId}/attachments`),
    )

    expect(response.status).toBe(http.status.NOT_FOUND)
  })
})
