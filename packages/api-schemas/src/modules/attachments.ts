import { z } from 'zod'

import { uploadMetaBody } from './upload-meta'

export const taskIdPathParams = z.object({
  id: z.uuid(),
})

export const taskAttachmentPathParams = z.object({
  id: z.uuid(),
  attachmentId: z.uuid(),
})

export const attachmentPresignBody = uploadMetaBody

export const attachmentCompleteBody = uploadMetaBody.extend({
  key: z.string().trim().min(1).max(1024),
})

export const attachmentResponse = z.object({
  id: z.uuid(),
  taskId: z.uuid(),
  filename: z.string(),
  contentType: z.string(),
  sizeBytes: z.number().int().positive(),
  createdAt: z.string(),
  updatedAt: z.string(),
  deletedAt: z.string().nullable(),
})

export const attachmentDownloadResponse = z.object({
  downloadUrl: z.string().url(),
})

export const attachmentPresignResponse = z.object({
  uploadUrl: z.string().url(),
  key: z.string(),
  expiresAt: z.string().datetime(),
})
