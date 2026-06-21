import {
  type AllowedContentType,
  AVATAR_UNSUPPORTED_TYPE_MESSAGE,
  type AvatarContentType,
  isAllowedContentType,
  isAvatarContentType,
  MAX_OBJECT_BYTES,
  UPLOAD_SIZE_LIMIT_MESSAGE,
  UPLOAD_UNSUPPORTED_TYPE_MESSAGE,
} from '@repro-v2/s3/constants'

// biome-ignore lint/performance/noBarrelFile: client-safe upload limits from s3/constants subpath
export {
  type AllowedContentType,
  AVATAR_HELPER_TEXT,
  AVATAR_UNSUPPORTED_TYPE_MESSAGE,
  type AvatarContentType,
  isAllowedContentType,
  isAvatarContentType,
  MAX_OBJECT_BYTES,
  UPLOAD_HELPER_TEXT,
  UPLOAD_SIZE_LIMIT_MESSAGE,
  UPLOAD_UNSUPPORTED_TYPE_MESSAGE,
} from '@repro-v2/s3/constants'

export interface UploadMeta {
  contentType: AllowedContentType
  filename: string
  sizeBytes: number
}

export interface AvatarUploadMeta {
  contentType: AvatarContentType
  filename: string
  sizeBytes: number
}

export function inspectUploadFile(
  file: File,
): { error: string } | { meta: UploadMeta } {
  if (file.size === 0) {
    return { error: 'File is empty' }
  }

  if (file.size > MAX_OBJECT_BYTES) {
    return { error: UPLOAD_SIZE_LIMIT_MESSAGE }
  }

  if (!isAllowedContentType(file.type)) {
    return { error: UPLOAD_UNSUPPORTED_TYPE_MESSAGE }
  }

  return {
    meta: {
      filename: file.name,
      contentType: file.type,
      sizeBytes: file.size,
    },
  }
}

export function validateUploadFile(file: File): string | null {
  const result = inspectUploadFile(file)
  return 'error' in result ? result.error : null
}

export function inspectAvatarUploadFile(
  file: File,
): { error: string } | { meta: AvatarUploadMeta } {
  if (file.size === 0) {
    return { error: 'File is empty' }
  }

  if (file.size > MAX_OBJECT_BYTES) {
    return { error: UPLOAD_SIZE_LIMIT_MESSAGE }
  }

  if (!isAvatarContentType(file.type)) {
    return { error: AVATAR_UNSUPPORTED_TYPE_MESSAGE }
  }

  return {
    meta: {
      filename: file.name,
      contentType: file.type,
      sizeBytes: file.size,
    },
  }
}

export function validateAvatarUploadFile(file: File): string | null {
  const result = inspectAvatarUploadFile(file)
  return 'error' in result ? result.error : null
}
