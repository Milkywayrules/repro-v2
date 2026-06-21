import {
  AVATAR_UNSUPPORTED_TYPE_MESSAGE,
  isAllowedContentType,
  MAX_OBJECT_BYTES,
  UPLOAD_SIZE_LIMIT_MESSAGE,
  UPLOAD_UNSUPPORTED_TYPE_MESSAGE,
} from '@repro-v2/s3/constants'
import { z } from 'zod'

const AVATAR_CONTENT_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
] as const

function isAvatarContentType(
  contentType: string,
): contentType is (typeof AVATAR_CONTENT_TYPES)[number] {
  return (AVATAR_CONTENT_TYPES as readonly string[]).includes(contentType)
}

const sizeBytesSchema = z.coerce
  .number()
  .int()
  .positive()
  .max(MAX_OBJECT_BYTES, UPLOAD_SIZE_LIMIT_MESSAGE)

export const uploadMetaBody = z.object({
  filename: z.string().trim().min(1).max(255),
  contentType: z
    .string()
    .refine(isAllowedContentType, UPLOAD_UNSUPPORTED_TYPE_MESSAGE),
  sizeBytes: sizeBytesSchema,
})

export const avatarUploadMetaBody = z.object({
  filename: z.string().trim().min(1).max(255),
  contentType: z
    .string()
    .refine(isAvatarContentType, AVATAR_UNSUPPORTED_TYPE_MESSAGE),
  sizeBytes: sizeBytesSchema,
})

export const uploadCompleteSizeBytes = sizeBytesSchema
