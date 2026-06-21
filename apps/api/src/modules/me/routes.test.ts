import { afterEach, describe, expect, spyOn, test } from 'bun:test'

import { env } from '@repro-v2/env/api'
import {
  AVATAR_UNSUPPORTED_TYPE_MESSAGE,
  MAX_OBJECT_BYTES,
  UPLOAD_SIZE_LIMIT_MESSAGE,
} from '@repro-v2/s3/constants'
import { Elysia } from 'elysia'

import { http } from '@/libs/contract'
import { iamService } from '@/modules/iam/service'
import { v1Routes } from '@/routes/v1'

import { meService } from './service'

const mockUser = {
  id: '00000000-0000-7000-8000-000000000002',
  name: 'Me User',
  email: 'me-user@example.com',
  emailVerified: true,
  createdAt: new Date(),
  updatedAt: new Date(),
  image: null,
}

const mockSession = {
  id: 'session-me',
  userId: mockUser.id,
  expiresAt: new Date(Date.now() + 3_600_000),
  token: 'test-token',
  createdAt: new Date(),
  updatedAt: new Date(),
  activeOrganizationId: null,
}

function createApp() {
  return new Elysia().use(http.plugin()).use(v1Routes)
}

function mockAuthedSession() {
  spyOn(iamService, 'getSession').mockResolvedValue({
    user: mockUser,
    session: mockSession,
  } as NonNullable<Awaited<ReturnType<typeof iamService.getSession>>>)
}

describe('me avatar routes', () => {
  afterEach(() => {
    spyOn(iamService, 'getSession').mockRestore()
    spyOn(meService, 'presignAvatar').mockRestore()
    spyOn(meService, 'completeAvatar').mockRestore()
  })

  test('POST /api/v1/me/avatar/presign returns 401 without session', async () => {
    spyOn(iamService, 'getSession').mockResolvedValue(null)

    const response = await createApp().handle(
      new Request('http://localhost/api/v1/me/avatar/presign', {
        method: 'POST',
        headers: {
          Origin: env.CORS_ORIGIN[0],
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          filename: 'avatar.png',
          contentType: 'image/png',
          sizeBytes: 1024,
        }),
      }),
    )

    expect(response.status).toBe(http.status.UNAUTHORIZED)
  })

  test('POST /api/v1/me/avatar/presign returns presign envelope', async () => {
    mockAuthedSession()
    spyOn(meService, 'presignAvatar').mockResolvedValue({
      uploadUrl: 'https://s3.example/upload',
      key: `avatars/${mockUser.id}/file.png`,
      publicUrl: 'https://cdn.example.test/avatars/file.png',
      expiresAt: '2026-01-01T00:05:00.000Z',
    })

    const response = await createApp().handle(
      new Request('http://localhost/api/v1/me/avatar/presign', {
        method: 'POST',
        headers: {
          Origin: env.CORS_ORIGIN[0],
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          filename: 'avatar.png',
          contentType: 'image/png',
          sizeBytes: 1024,
        }),
      }),
    )

    expect(response.status).toBe(http.status.OK)
    const body = (await response.json()) as {
      data: { uploadUrl: string; key: string; publicUrl: string }
    }
    expect(body.data.uploadUrl).toContain('https://')
    expect(body.data.key).toContain(`avatars/${mockUser.id}`)
  })

  test('POST /api/v1/me/avatar/presign returns 422 for invalid content type', async () => {
    mockAuthedSession()

    const response = await createApp().handle(
      new Request('http://localhost/api/v1/me/avatar/presign', {
        method: 'POST',
        headers: {
          Origin: env.CORS_ORIGIN[0],
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          filename: 'installer.exe',
          contentType: 'application/x-msdownload',
          sizeBytes: 1024,
        }),
      }),
    )

    expect(response.status).toBe(http.status.UNPROCESSABLE_ENTITY)
    const body = (await response.json()) as {
      error: { code: string; message: string }
    }
    expect(body.error.code).toBe(http.codes.VALIDATION_ERROR)
    expect(body.error.message).toBe(AVATAR_UNSUPPORTED_TYPE_MESSAGE)
  })

  test('POST /api/v1/me/avatar/presign returns 422 for oversize file', async () => {
    mockAuthedSession()

    const response = await createApp().handle(
      new Request('http://localhost/api/v1/me/avatar/presign', {
        method: 'POST',
        headers: {
          Origin: env.CORS_ORIGIN[0],
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          filename: 'large.png',
          contentType: 'image/png',
          sizeBytes: MAX_OBJECT_BYTES + 1,
        }),
      }),
    )

    expect(response.status).toBe(http.status.UNPROCESSABLE_ENTITY)
    const body = (await response.json()) as {
      error: { code: string; message: string }
    }
    expect(body.error.code).toBe(http.codes.VALIDATION_ERROR)
    expect(body.error.message).toBe(UPLOAD_SIZE_LIMIT_MESSAGE)
  })

  test('POST /api/v1/me/avatar/complete updates avatar', async () => {
    mockAuthedSession()
    spyOn(meService, 'completeAvatar').mockResolvedValue({
      image: 'https://cdn.example.test/avatars/file.png',
    })

    const response = await createApp().handle(
      new Request('http://localhost/api/v1/me/avatar/complete', {
        method: 'POST',
        headers: {
          Origin: env.CORS_ORIGIN[0],
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          key: `avatars/${mockUser.id}/file.png`,
          sizeBytes: 1024,
        }),
      }),
    )

    expect(response.status).toBe(http.status.OK)
    const body = (await response.json()) as { data: { image: string } }
    expect(body.data.image).toContain('https://')
  })
})
