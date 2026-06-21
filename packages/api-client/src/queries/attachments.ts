import { queryOptions } from '@tanstack/react-query'

import type { ApiClient } from '../index'
import { normalizeUnknownNetworkError } from '../network-error'
import type { UploadMeta } from '../upload-limits'
import { attachmentKeys } from './keys'
import { unwrapTreatyResponse } from './treaty'

export type { UploadMeta } from '../upload-limits'

export function taskAttachmentsQueryOptions(client: ApiClient, taskId: string) {
  return queryOptions({
    queryKey: attachmentKeys.list(taskId),
    queryFn: async () => {
      const response = await client.api.v1
        .tasks({ id: taskId })
        .attachments.get()
      return unwrapTreatyResponse(response)
    },
    enabled: Boolean(taskId),
  })
}

export async function presignTaskAttachment(
  client: ApiClient,
  taskId: string,
  body: UploadMeta,
) {
  const response = await client.api.v1
    .tasks({ id: taskId })
    .attachments.presign.post(body)
  return unwrapTreatyResponse(response)
}

export async function completeTaskAttachment(
  client: ApiClient,
  taskId: string,
  body: UploadMeta & { key: string },
) {
  const response = await client.api.v1
    .tasks({ id: taskId })
    .attachments.complete.post(body)
  return unwrapTreatyResponse(response)
}

export async function downloadTaskAttachment(
  client: ApiClient,
  taskId: string,
  attachmentId: string,
) {
  const response = await client.api.v1
    .tasks({ id: taskId })
    .attachments({ attachmentId })
    .download.get()
  return unwrapTreatyResponse(response)
}

export async function deleteTaskAttachment(
  client: ApiClient,
  taskId: string,
  attachmentId: string,
) {
  const response = await client.api.v1
    .tasks({ id: taskId })
    .attachments({ attachmentId })
    .delete()
  return unwrapTreatyResponse(response)
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
