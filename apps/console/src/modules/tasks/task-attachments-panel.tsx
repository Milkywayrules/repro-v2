'use client'

import { useRef } from 'react'

import {
  attachmentKeys,
  completeTaskAttachment,
  deleteTaskAttachment,
  downloadTaskAttachment,
  formatTreatyError,
  presignTaskAttachment,
  taskAttachmentsQueryOptions,
  uploadFileToPresignedUrl,
} from '@repro-v2/api-client/queries'
import { isAllowedContentType } from '@repro-v2/s3'
import { Button } from '@repro-v2/ui/components/button'
import { Input } from '@repro-v2/ui/components/input'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { InlineErrorCallout } from '@/components/inline-error-callout'
import { apiClient } from '@/lib/api-client'

interface TaskAttachmentsPanelProps {
  taskId: string
}

export function TaskAttachmentsPanel({ taskId }: TaskAttachmentsPanelProps) {
  const queryClient = useQueryClient()
  const attachmentInputRef = useRef<HTMLInputElement>(null)

  const attachmentsQuery = useQuery({
    ...taskAttachmentsQueryOptions(apiClient, taskId),
    enabled: Boolean(taskId),
  })
  const attachments = attachmentsQuery.data?.data ?? []

  const uploadAttachmentMutation = useMutation({
    mutationFn: async (file: File) => {
      if (!isAllowedContentType(file.type)) {
        throw new Error('Unsupported file type')
      }

      const presign = await presignTaskAttachment(apiClient, taskId, {
        filename: file.name,
        contentType: file.type,
        sizeBytes: file.size,
      })
      await uploadFileToPresignedUrl(presign.data.uploadUrl, file)
      return await completeTaskAttachment(apiClient, taskId, {
        key: presign.data.key,
        filename: file.name,
        contentType: file.type,
        sizeBytes: file.size,
      })
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: attachmentKeys.list(taskId),
      })
      if (attachmentInputRef.current) {
        attachmentInputRef.current.value = ''
      }
    },
  })

  const deleteAttachmentMutation = useMutation({
    mutationFn: (attachmentId: string) =>
      deleteTaskAttachment(apiClient, taskId, attachmentId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: attachmentKeys.list(taskId),
      })
    },
  })

  const downloadAttachmentMutation = useMutation({
    mutationFn: (attachmentId: string) =>
      downloadTaskAttachment(apiClient, taskId, attachmentId),
    onSuccess: data => {
      window.open(data.data.downloadUrl, '_blank', 'noopener,noreferrer')
    },
  })

  const activeError =
    uploadAttachmentMutation.error ??
    deleteAttachmentMutation.error ??
    downloadAttachmentMutation.error

  const error = activeError
    ? formatTreatyError(activeError, 'Something went wrong')
    : null

  const attachmentsError = attachmentsQuery.isError
    ? formatTreatyError(attachmentsQuery.error, 'Failed to load attachments')
    : null

  function handleUploadAttachment() {
    const file = attachmentInputRef.current?.files?.[0]
    if (!file) {
      return
    }

    uploadAttachmentMutation.mutate(file)
  }

  function resetMutationErrors() {
    uploadAttachmentMutation.reset()
    deleteAttachmentMutation.reset()
    downloadAttachmentMutation.reset()
  }

  return (
    <section className="flex flex-col gap-2">
      <h2 className="font-medium text-lg">Attachments</h2>
      {attachmentsQuery.isPending ? (
        <p className="text-muted-foreground text-sm">Loading attachments…</p>
      ) : null}
      {attachmentsError ? (
        <InlineErrorCallout>{attachmentsError}</InlineErrorCallout>
      ) : null}
      {error ? (
        <div className="space-y-2">
          <InlineErrorCallout>{error}</InlineErrorCallout>
          <Button onClick={resetMutationErrors} type="button" variant="outline">
            Try again
          </Button>
        </div>
      ) : null}
      <ul className="flex flex-col gap-2">
        {attachments.map(attachment => (
          <li
            className="flex items-center justify-between gap-2 rounded border p-2"
            key={attachment.id}
          >
            <span className="text-sm">{attachment.filename}</span>
            <div className="flex gap-2">
              <Button
                onClick={() => downloadAttachmentMutation.mutate(attachment.id)}
                size="sm"
                variant="outline"
              >
                Download
              </Button>
              <Button
                onClick={() => deleteAttachmentMutation.mutate(attachment.id)}
                size="sm"
                variant="destructive"
              >
                Delete
              </Button>
            </div>
          </li>
        ))}
      </ul>
      <div className="flex gap-2">
        <Input
          accept="image/jpeg,image/png,image/webp,image/gif,application/pdf,text/plain"
          ref={attachmentInputRef}
          type="file"
        />
        <Button
          disabled={uploadAttachmentMutation.isPending}
          onClick={handleUploadAttachment}
          type="button"
        >
          Upload
        </Button>
      </div>
    </section>
  )
}
