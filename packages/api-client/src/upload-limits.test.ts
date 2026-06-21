import { describe, expect, test } from 'bun:test'

import {
  AVATAR_FILE_TYPES_MESSAGE,
  AVATAR_UNSUPPORTED_TYPE_MESSAGE,
  MAX_OBJECT_BYTES,
  MAX_UPLOAD_SIZE_LABEL,
  UPLOAD_FILE_TYPES_MESSAGE,
  UPLOAD_SIZE_LIMIT_MESSAGE,
  UPLOAD_UNSUPPORTED_TYPE_MESSAGE,
} from '@repro-v2/s3/constants'

import {
  inspectAvatarUploadFile,
  inspectUploadFile,
  validateAvatarUploadFile,
  validateUploadFile,
} from './upload-limits'

function mockFile(sizeBytes: number, type = 'image/png', name = 'photo.png') {
  const buffer = new Uint8Array(sizeBytes)
  return new File([buffer], name, { type })
}

describe('upload-limits', () => {
  test('size limit message mentions 10 MB', () => {
    expect(UPLOAD_SIZE_LIMIT_MESSAGE).toContain(MAX_UPLOAD_SIZE_LABEL)
  })

  test('unsupported type message mentions allowed file types', () => {
    expect(UPLOAD_UNSUPPORTED_TYPE_MESSAGE).toContain(UPLOAD_FILE_TYPES_MESSAGE)
  })

  test('validateUploadFile rejects oversize files with size hint', () => {
    const file = mockFile(MAX_OBJECT_BYTES + 1)

    expect(validateUploadFile(file)).toBe(UPLOAD_SIZE_LIMIT_MESSAGE)
  })

  test('validateUploadFile rejects unsupported content types', () => {
    const file = mockFile(1024, 'application/x-msdownload', 'installer.exe')

    expect(validateUploadFile(file)).toBe(UPLOAD_UNSUPPORTED_TYPE_MESSAGE)
  })

  test('inspectUploadFile accepts allowed files', () => {
    const file = mockFile(1024, 'application/pdf', 'notes.pdf')

    expect(inspectUploadFile(file)).toEqual({
      meta: {
        filename: 'notes.pdf',
        contentType: 'application/pdf',
        sizeBytes: 1024,
      },
    })
  })

  test('validateAvatarUploadFile rejects non-image content types', () => {
    const file = mockFile(1024, 'application/pdf', 'notes.pdf')

    expect(validateAvatarUploadFile(file)).toBe(AVATAR_UNSUPPORTED_TYPE_MESSAGE)
  })

  test('avatar unsupported type message mentions image file types', () => {
    expect(AVATAR_UNSUPPORTED_TYPE_MESSAGE).toContain(AVATAR_FILE_TYPES_MESSAGE)
  })

  test('inspectAvatarUploadFile accepts image files', () => {
    const file = mockFile(1024, 'image/png', 'avatar.png')

    expect(inspectAvatarUploadFile(file)).toEqual({
      meta: {
        filename: 'avatar.png',
        contentType: 'image/png',
        sizeBytes: 1024,
      },
    })
  })
})
