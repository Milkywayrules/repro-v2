import { db } from '@repro-v2/db'
import { and, asc, eq, isNull } from '@repro-v2/db/drizzle'
import { taskAttachments } from '@repro-v2/db/schema/attachments'
import { env } from '@repro-v2/env/api'
import {
  attachmentObjectKey,
  createS3ClientFromEnv,
  headObject,
  isAllowedContentType,
  isAttachmentKeyForTask,
  isWithinSizeLimit,
  normalizeMimeType,
  presignGet,
  presignPut,
  presignPutExpiresAt,
} from '@repro-v2/s3'

import { http } from '@/libs/contract'
import { internalServerError, notFoundError } from '@/libs/contract/errors'
import { serializeAuditTimestamps } from '@/libs/helpers/serialize-audit'
import { tasksService } from '@/modules/tasks/service'

const s3Client = createS3ClientFromEnv()

function validationError(message: string) {
  return http.error({
    code: http.codes.VALIDATION_ERROR,
    message,
    status: http.status.UNPROCESSABLE_ENTITY,
  })
}

function toResponse(row: typeof taskAttachments.$inferSelect) {
  return {
    id: row.id,
    taskId: row.taskId,
    filename: row.filename,
    contentType: row.contentType,
    sizeBytes: row.sizeBytes,
    ...serializeAuditTimestamps(row),
  }
}

async function listForTask(
  userId: string,
  workspaceId: string,
  taskId: string,
) {
  await tasksService.getForUser(userId, workspaceId, taskId)

  const rows = await db
    .select()
    .from(taskAttachments)
    .where(
      and(
        eq(taskAttachments.taskId, taskId),
        eq(taskAttachments.workspaceId, workspaceId),
        isNull(taskAttachments.deletedAt),
      ),
    )
    .orderBy(asc(taskAttachments.createdAt))

  return rows
}

async function presignUpload(
  userId: string,
  workspaceId: string,
  taskId: string,
  input: { filename: string; contentType: string; sizeBytes: number },
) {
  await tasksService.getForUser(userId, workspaceId, taskId)

  if (!isAllowedContentType(input.contentType)) {
    throw validationError('Unsupported content type')
  }

  if (!isWithinSizeLimit(input.sizeBytes)) {
    throw validationError('File exceeds maximum size')
  }

  const key = attachmentObjectKey(workspaceId, taskId, input.contentType)
  const uploadUrl = await presignPut(
    s3Client,
    env.S3_BUCKET_PRIVATE,
    key,
    input.contentType,
    { contentLength: input.sizeBytes },
  )

  return { uploadUrl, key, expiresAt: presignPutExpiresAt() }
}

async function completeUpload(
  userId: string,
  workspaceId: string,
  taskId: string,
  input: {
    key: string
    filename: string
    contentType: string
    sizeBytes: number
  },
) {
  await tasksService.getForUser(userId, workspaceId, taskId)

  if (!isAttachmentKeyForTask(input.key, workspaceId, taskId)) {
    throw validationError('Invalid storage key')
  }

  if (!isAllowedContentType(input.contentType)) {
    throw validationError('Unsupported content type')
  }

  if (!isWithinSizeLimit(input.sizeBytes)) {
    throw validationError('File exceeds maximum size')
  }

  const head = await headObject(s3Client, env.S3_BUCKET_PRIVATE, input.key)

  if (!head.exists) {
    throw notFoundError()
  }

  if (
    head.contentLength === undefined ||
    head.contentLength !== input.sizeBytes
  ) {
    throw validationError('Uploaded object size does not match')
  }

  if (
    !head.contentType ||
    normalizeMimeType(head.contentType) !== input.contentType
  ) {
    throw validationError('Uploaded object content type does not match')
  }

  const [row] = await db
    .insert(taskAttachments)
    .values({
      taskId,
      workspaceId,
      storageKey: input.key,
      filename: input.filename,
      contentType: input.contentType,
      sizeBytes: input.sizeBytes,
      createdById: userId,
    })
    .returning()

  if (!row) {
    throw internalServerError()
  }

  return row
}

async function getForTask(
  userId: string,
  workspaceId: string,
  taskId: string,
  attachmentId: string,
) {
  await tasksService.getForUser(userId, workspaceId, taskId)

  const [row] = await db
    .select()
    .from(taskAttachments)
    .where(
      and(
        eq(taskAttachments.id, attachmentId),
        eq(taskAttachments.taskId, taskId),
        eq(taskAttachments.workspaceId, workspaceId),
        isNull(taskAttachments.deletedAt),
      ),
    )
    .limit(1)

  if (!row) {
    throw notFoundError()
  }

  return row
}

async function presignDownload(
  userId: string,
  workspaceId: string,
  taskId: string,
  attachmentId: string,
) {
  const row = await getForTask(userId, workspaceId, taskId, attachmentId)
  const downloadUrl = await presignGet(
    s3Client,
    env.S3_BUCKET_PRIVATE,
    row.storageKey,
  )

  return { downloadUrl }
}

async function remove(
  userId: string,
  workspaceId: string,
  taskId: string,
  attachmentId: string,
) {
  await getForTask(userId, workspaceId, taskId, attachmentId)
  const now = new Date()

  const [row] = await db
    .update(taskAttachments)
    .set({
      deletedAt: now,
      deletedById: userId,
      updatedById: userId,
    })
    .where(
      and(
        eq(taskAttachments.id, attachmentId),
        eq(taskAttachments.taskId, taskId),
        eq(taskAttachments.workspaceId, workspaceId),
        isNull(taskAttachments.deletedAt),
      ),
    )
    .returning()

  if (!row) {
    throw notFoundError()
  }

  return row
}

export const attachmentsService = {
  listForTask,
  presignUpload,
  completeUpload,
  presignDownload,
  delete: remove,
  toResponse,
}
