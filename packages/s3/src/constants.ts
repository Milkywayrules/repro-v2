export const MAX_OBJECT_BYTES = 10 * 1024 * 1024

export const MAX_UPLOAD_SIZE_LABEL = '10 MB'

export const UPLOAD_FILE_TYPES_MESSAGE =
  'JPEG, PNG, WebP, GIF, PDF, or plain text'

export const AVATAR_FILE_TYPES_MESSAGE = 'JPEG, PNG, WebP, or GIF'

export const UPLOAD_SIZE_LIMIT_MESSAGE = `File exceeds the ${MAX_UPLOAD_SIZE_LABEL} limit`

export const UPLOAD_UNSUPPORTED_TYPE_MESSAGE = `Unsupported file type. Use ${UPLOAD_FILE_TYPES_MESSAGE}.`

export const AVATAR_UNSUPPORTED_TYPE_MESSAGE = `Unsupported file type. Use ${AVATAR_FILE_TYPES_MESSAGE}.`

export const UPLOAD_HELPER_TEXT = `${UPLOAD_FILE_TYPES_MESSAGE} up to ${MAX_UPLOAD_SIZE_LABEL}`

export const AVATAR_HELPER_TEXT = `${AVATAR_FILE_TYPES_MESSAGE} up to ${MAX_UPLOAD_SIZE_LABEL}`

export const ALLOWED_CONTENT_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'application/pdf',
  'text/plain',
] as const

export type AllowedContentType = (typeof ALLOWED_CONTENT_TYPES)[number]

const MIME_TO_EXT: Record<AllowedContentType, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
  'application/pdf': 'pdf',
  'text/plain': 'txt',
}

export function extensionForContentType(contentType: string): string | null {
  if (!(ALLOWED_CONTENT_TYPES as readonly string[]).includes(contentType)) {
    return null
  }

  return MIME_TO_EXT[contentType as AllowedContentType]
}

export function isAllowedContentType(
  contentType: string,
): contentType is AllowedContentType {
  return (ALLOWED_CONTENT_TYPES as readonly string[]).includes(contentType)
}

export function isWithinSizeLimit(sizeBytes: number): boolean {
  return sizeBytes > 0 && sizeBytes <= MAX_OBJECT_BYTES
}
