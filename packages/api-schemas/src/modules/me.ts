import { isAllowedContentType, MAX_OBJECT_BYTES } from '@repro-v2/s3/constants'
import { z } from 'zod'

const allowedContentTypeSchema = z
  .string()
  .refine(isAllowedContentType, 'Unsupported content type')

const uploadMeta = z.object({
  filename: z.string().trim().min(1).max(255),
  contentType: allowedContentTypeSchema,
  sizeBytes: z.coerce.number().int().positive().max(MAX_OBJECT_BYTES),
})

export const avatarPresignBody = uploadMeta

export const avatarCompleteBody = z.object({
  key: z.string().trim().min(1).max(1024),
  sizeBytes: z.coerce.number().int().positive().max(MAX_OBJECT_BYTES),
})

export const avatarPresignResponse = z.object({
  uploadUrl: z.string().url(),
  key: z.string(),
  publicUrl: z.string().url(),
  expiresAt: z.string().datetime(),
})

export const avatarCompleteResponse = z.object({
  image: z.string().url(),
})
