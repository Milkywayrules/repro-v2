import { z } from 'zod'

import { avatarUploadMetaBody, uploadCompleteSizeBytes } from './upload-meta'

export const avatarPresignBody = avatarUploadMetaBody

export const avatarCompleteBody = z.object({
  key: z.string().trim().min(1).max(1024),
  sizeBytes: uploadCompleteSizeBytes,
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
