import {
  type AllowedContentType,
  isAllowedContentType,
  MAX_OBJECT_BYTES,
} from '@repro-v2/s3/constants'

// biome-ignore lint/performance/noBarrelFile: client-safe upload limits from s3/constants subpath
export {
  type AllowedContentType,
  isAllowedContentType,
  MAX_OBJECT_BYTES,
} from '@repro-v2/s3/constants'

export interface UploadMeta {
  contentType: AllowedContentType
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
    return { error: 'File exceeds maximum size' }
  }

  if (!isAllowedContentType(file.type)) {
    return { error: 'Unsupported file type' }
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
