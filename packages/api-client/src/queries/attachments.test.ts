import { afterEach, describe, expect, mock, test } from 'bun:test'

import { uploadFileToPresignedUrl } from './attachments'

const originalFetch = globalThis.fetch

function mockFile(type = 'image/png') {
  return new File(['content'], 'photo.png', { type })
}

function mockFetch(impl: () => Promise<Response> | Promise<never>) {
  globalThis.fetch = mock(impl) as unknown as typeof fetch
}

describe('uploadFileToPresignedUrl', () => {
  afterEach(() => {
    globalThis.fetch = originalFetch
    mock.restore()
  })

  test('succeeds when presigned PUT returns ok', async () => {
    mockFetch(() => Promise.resolve(new Response(null, { status: 200 })))

    await expect(
      uploadFileToPresignedUrl('https://s3.example/upload', mockFile()),
    ).resolves.toBeUndefined()
  })

  test('throws friendly message for 403', async () => {
    mockFetch(() => Promise.resolve(new Response(null, { status: 403 })))

    await expect(
      uploadFileToPresignedUrl('https://s3.example/upload', mockFile()),
    ).rejects.toThrow('Upload link expired or denied. Please try again.')
  })

  test('throws friendly message for other non-ok status', async () => {
    mockFetch(() => Promise.resolve(new Response(null, { status: 500 })))

    await expect(
      uploadFileToPresignedUrl('https://s3.example/upload', mockFile()),
    ).rejects.toThrow(
      'Could not upload the file. Check your connection and try again.',
    )
  })

  test('throws friendly message for network failures', async () => {
    mockFetch(() => Promise.reject(new TypeError('Failed to fetch')))

    await expect(
      uploadFileToPresignedUrl('https://s3.example/upload', mockFile()),
    ).rejects.toThrow(
      'Could not reach the server. Check your connection and try again.',
    )
  })
})
