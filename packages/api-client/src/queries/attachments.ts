import { queryOptions } from '@tanstack/react-query'

import { type ApiClient, tasksApi } from '../index'
import { normalizeUnknownNetworkError } from '../network-error'
import type { UploadMeta } from '../upload-limits'
import { attachmentKeys } from './keys'
import { unwrapTreatyResponse } from './treaty'

export type { UploadMeta } from '../upload-limits'

export interface TaskAttachmentsListResponse {
  data: Array<{
    id: string
    filename: string
    contentType: string
    sizeBytes: number
  }>
}

export interface AttachmentPresignResponse {
  data: {
    uploadUrl: string
    key: string
  }
}

export interface AttachmentCompleteResponse {
  data: TaskAttachmentsListResponse['data'][number]
}

export interface AttachmentDownloadResponse {
  data: {
    downloadUrl: string
  }
}

export function taskAttachmentsQueryOptions(
  client: ApiClient,
  taskId: string,
  workspaceSlug?: string,
) {
  return queryOptions({
    queryKey: attachmentKeys.list(taskId, workspaceSlug),
    queryFn: async () => {
      const response = await tasksApi(
        client,
        workspaceSlug,
      )({ id: taskId }).attachments.get()
      return unwrapTreatyResponse(response) as TaskAttachmentsListResponse
    },
    enabled: Boolean(taskId),
  })
}

export async function presignTaskAttachment(
  client: ApiClient,
  taskId: string,
  body: UploadMeta,
  workspaceSlug?: string,
) {
  const response = await tasksApi(
    client,
    workspaceSlug,
  )({ id: taskId }).attachments.presign.post(body)
  return unwrapTreatyResponse(response) as AttachmentPresignResponse
}

export async function completeTaskAttachment(
  client: ApiClient,
  taskId: string,
  body: UploadMeta & { key: string },
  workspaceSlug?: string,
) {
  const response = await tasksApi(
    client,
    workspaceSlug,
  )({ id: taskId }).attachments.complete.post(body)
  return unwrapTreatyResponse(response) as AttachmentCompleteResponse
}

export async function downloadTaskAttachment(
  client: ApiClient,
  taskId: string,
  attachmentId: string,
  workspaceSlug?: string,
) {
  const response = await tasksApi(
    client,
    workspaceSlug,
  )({ id: taskId })
    .attachments({ attachmentId })
    .download.get()
  return unwrapTreatyResponse(response) as AttachmentDownloadResponse
}

export async function deleteTaskAttachment(
  client: ApiClient,
  taskId: string,
  attachmentId: string,
  workspaceSlug?: string,
) {
  const response = await tasksApi(
    client,
    workspaceSlug,
  )({ id: taskId })
    .attachments({ attachmentId })
    .delete()
  return unwrapTreatyResponse(response) as AttachmentCompleteResponse
}

export async function uploadFileToPresignedUrl(
  uploadUrl: string,
  file: File,
): Promise<void> {
  let response: Response

  try {
    response = await fetch(uploadUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': file.type,
      },
      body: file,
    })
  } catch (error) {
    throw new Error(normalizeUnknownNetworkError(error))
  }

  if (!response.ok) {
    if (response.status === 403) {
      throw new Error('Upload link expired or denied. Please try again.')
    }

    throw new Error(
      'Could not upload the file. Check your connection and try again.',
    )
  }
}
