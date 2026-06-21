import { afterEach, describe, expect, mock, test } from 'bun:test'

import { HeadObjectCommand } from '@aws-sdk/client-s3'

import { headObject } from './head'
import { presignGet, presignPut } from './presign'

const getSignedUrlMock = mock(() =>
  Promise.resolve('https://signed.example/put'),
)

mock.module('@aws-sdk/s3-request-presigner', () => ({
  getSignedUrl: getSignedUrlMock,
}))

describe('s3 presign and head', () => {
  afterEach(() => {
    getSignedUrlMock.mockClear()
  })

  test('presignGet delegates to getSignedUrl', async () => {
    const client = {
      config: { endpointProvider: () => 'https://example.com' },
    } as never

    const url = await presignGet(
      client,
      'private-bucket',
      'attachments/w/t/file.pdf',
    )

    expect(url).toBe('https://signed.example/put')
    expect(getSignedUrlMock).toHaveBeenCalled()
  })

  test('presignPut delegates to getSignedUrl', async () => {
    const client = {
      config: { endpointProvider: () => 'https://example.com' },
    } as never

    const url = await presignPut(
      client,
      'bucket',
      'avatars/u/file.png',
      'image/png',
    )

    expect(url).toBe('https://signed.example/put')
    expect(getSignedUrlMock).toHaveBeenCalled()
  })

  test('headObject returns exists false on 404', async () => {
    const client = {
      send: mock(() =>
        Promise.reject({
          $metadata: { httpStatusCode: 404 },
        }),
      ),
    } as never

    const result = await headObject(client, 'bucket', 'missing-key')
    expect(result.exists).toBe(false)
  })

  test('headObject returns metadata on success', async () => {
    const client = {
      send: mock((command: unknown) => {
        expect(command).toBeInstanceOf(HeadObjectCommand)
        return Promise.resolve({
          ContentType: 'image/png',
          ContentLength: 512,
        })
      }),
    } as never

    const result = await headObject(client, 'bucket', 'avatars/u/file.png')
    expect(result).toEqual({
      exists: true,
      contentType: 'image/png',
      contentLength: 512,
    })
  })
})
