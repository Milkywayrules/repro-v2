import { describe, expect, test } from 'bun:test'

import {
  extensionForContentType,
  isAllowedContentType,
  isWithinSizeLimit,
  MAX_OBJECT_BYTES,
} from './constants'
import { resolveS3Endpoint } from './endpoint'
import {
  attachmentObjectKey,
  avatarObjectKey,
  isAttachmentKeyForTask,
  isAvatarKeyForUser,
  publicObjectUrl,
} from './keys'

describe('s3 constants', () => {
  test('allows known MIME types', () => {
    expect(isAllowedContentType('image/png')).toBe(true)
    expect(isAllowedContentType('application/octet-stream')).toBe(false)
  })

  test('maps MIME types to extensions', () => {
    expect(extensionForContentType('image/jpeg')).toBe('jpg')
    expect(extensionForContentType('text/plain')).toBe('txt')
  })

  test('enforces size limit', () => {
    expect(isWithinSizeLimit(1)).toBe(true)
    expect(isWithinSizeLimit(MAX_OBJECT_BYTES)).toBe(true)
    expect(isWithinSizeLimit(MAX_OBJECT_BYTES + 1)).toBe(false)
    expect(isWithinSizeLimit(0)).toBe(false)
  })
})

describe('s3 keys', () => {
  test('builds avatar key with user id prefix', () => {
    const key = avatarObjectKey('user-1', 'image/png')
    expect(key.startsWith('avatars/user-1/')).toBe(true)
    expect(key.endsWith('.png')).toBe(true)
  })

  test('builds attachment key with workspace and task', () => {
    const key = attachmentObjectKey('ws-1', 'task-1', 'application/pdf')
    expect(key).toBe(`attachments/ws-1/task-1/${key.split('/').at(-1)}`)
    expect(key.endsWith('.pdf')).toBe(true)
  })

  test('validates avatar key ownership', () => {
    expect(isAvatarKeyForUser('avatars/u1/file.png', 'u1')).toBe(true)
    expect(isAvatarKeyForUser('avatars/u2/file.png', 'u1')).toBe(false)
  })

  test('validates attachment key ownership', () => {
    expect(isAttachmentKeyForTask('attachments/ws/t/file.pdf', 'ws', 't')).toBe(
      true,
    )
    expect(
      isAttachmentKeyForTask('attachments/ws/t2/file.pdf', 'ws', 't'),
    ).toBe(false)
  })

  test('rejects unsafe storage keys', () => {
    expect(isAvatarKeyForUser('../avatars/u1/file.png', 'u1')).toBe(false)
    expect(isAvatarKeyForUser('/avatars/u1/file.png', 'u1')).toBe(false)
    expect(isAvatarKeyForUser('avatars\\u1\\file.png', 'u1')).toBe(false)
    expect(
      isAttachmentKeyForTask('attachments/ws/../other/file.pdf', 'ws', 't'),
    ).toBe(false)
  })

  test('builds public URL without trailing slash on base', () => {
    expect(publicObjectUrl('https://cdn.example.com', 'avatars/u/a.png')).toBe(
      'https://cdn.example.com/avatars/u/a.png',
    )
    expect(publicObjectUrl('https://cdn.example.com/', 'avatars/u/a.png')).toBe(
      'https://cdn.example.com/avatars/u/a.png',
    )
  })
})

describe('resolveS3Endpoint', () => {
  test('derives R2 endpoint from account id', () => {
    expect(resolveS3Endpoint('abc123')).toBe(
      'https://abc123.r2.cloudflarestorage.com',
    )
  })

  test('uses explicit endpoint when provided', () => {
    expect(resolveS3Endpoint('abc123', 'https://custom.example/')).toBe(
      'https://custom.example',
    )
  })
})
