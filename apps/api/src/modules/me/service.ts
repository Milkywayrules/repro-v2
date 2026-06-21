import { db } from '@repro-v2/db'
import { eq } from '@repro-v2/db/drizzle'
import { user } from '@repro-v2/db/schema/auth'
import { env } from '@repro-v2/env/api'
import {
  avatarObjectKey,
  createS3ClientFromEnv,
  headObject,
  isAllowedContentType,
  isAvatarKeyForUser,
  isWithinSizeLimit,
  normalizeMimeType,
  presignPut,
  presignPutExpiresAt,
  publicObjectUrl,
} from '@repro-v2/s3'

import { http } from '@/libs/contract'
import { internalServerError } from '@/libs/contract/errors'

const s3Client = createS3ClientFromEnv()

function validationError(message: string) {
  return http.error({
    code: http.codes.VALIDATION_ERROR,
    message,
    status: http.status.UNPROCESSABLE_ENTITY,
  })
}

function assertAllowedUpload(contentType: string, sizeBytes: number) {
  if (!isAllowedContentType(contentType)) {
    throw validationError('Unsupported content type')
  }

  if (!isWithinSizeLimit(sizeBytes)) {
    throw validationError('File exceeds maximum size')
  }
}

async function presignAvatar(
  userId: string,
  input: { filename: string; contentType: string; sizeBytes: number },
) {
  assertAllowedUpload(input.contentType, input.sizeBytes)

  const key = avatarObjectKey(userId, input.contentType)
  const uploadUrl = await presignPut(
    s3Client,
    env.S3_BUCKET_PUBLIC,
    key,
    input.contentType,
    { contentLength: input.sizeBytes },
  )
  const publicUrl = publicObjectUrl(env.S3_PUBLIC_BASE_URL, key)

  return { uploadUrl, key, publicUrl, expiresAt: presignPutExpiresAt() }
}

async function completeAvatar(userId: string, key: string, sizeBytes: number) {
  if (!isAvatarKeyForUser(key, userId)) {
    throw validationError('Invalid storage key')
  }

  if (!isWithinSizeLimit(sizeBytes)) {
    throw validationError('File exceeds maximum size')
  }

  const head = await headObject(s3Client, env.S3_BUCKET_PUBLIC, key)

  if (!head.exists) {
    throw validationError('File was not uploaded successfully')
  }

  if (head.contentLength === undefined || head.contentLength !== sizeBytes) {
    throw validationError('Uploaded object size does not match')
  }

  if (!head.contentType) {
    throw validationError('Uploaded object has unsupported content type')
  }

  const uploadedType = normalizeMimeType(head.contentType)
  if (!isAllowedContentType(uploadedType)) {
    throw validationError('Uploaded object has unsupported content type')
  }

  const image = publicObjectUrl(env.S3_PUBLIC_BASE_URL, key)

  const [row] = await db
    .update(user)
    .set({ image, updatedAt: new Date() })
    .where(eq(user.id, userId))
    .returning({ image: user.image })

  if (!row?.image) {
    throw internalServerError()
  }

  return { image: row.image }
}

export const meService = {
  presignAvatar,
  completeAvatar,
}
