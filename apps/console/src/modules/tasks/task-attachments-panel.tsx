'use client'

import { useRef, useState } from 'react'

import {
  attachmentKeys,
  completeTaskAttachment,
  deleteTaskAttachment,
  downloadTaskAttachment,
  formatTreatyError,
  isAllowedContentType,
  MAX_OBJECT_BYTES,
  presignTaskAttachment,
  taskAttachmentsQueryOptions,
  uploadFileToPresignedUrl,
} from '@repro-v2/api-client/queries'
import { Button } from '@repro-v2/ui/components/button'
import { Input } from '@repro-v2/ui/components/input'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { InlineErrorCallout } from '@/components/inline-error-callout'
import { apiClient } from '@/lib/api-client'

interface TaskAttachmentsPanelProps {
  taskId: string
}

function triggerDownload(url: string, filename?: string) {
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.rel = 'noopener noreferrer'
  if (filename) {
    anchor.download = filename
  }
  document.body.append(anchor)
  anchor.click()
  anchor.remove()
}

function openDownloadFallback(url: string) {
  const popup = window.open(url, '_blank', 'noopener,noreferrer')
  if (popup === null) {
    throw new Error(
      'Download was blocked. Allow pop-ups for this site and try again.',
    )
  }
}

function downloadPresignedFile(url: string, filename?: string) {
  try {
    triggerDownload(url, filename)
  } catch {
    openDownloadFallback(url)
  }
}

export function TaskAttachmentsPanel({ taskId }: TaskAttachmentsPanelProps) {
  const queryClient = useQueryClient()
  const attachmentInputRef = useRef<HTMLInputElement>(null)
  const [hasSelectedFile, setHasSelectedFile] = useState(false)
  const [validationError, setValidationError] = useState<string | null>(null)

  const attachmentsQuery = useQuery({
    ...taskAttachmentsQueryOptions(apiClient, taskId),
    enabled: Boolean(taskId),
  })
  const attachments = attachmentsQuery.data?.data ?? []

  async function refreshAttachments() {
    await queryClient.invalidateQueries({
      queryKey: attachmentKeys.list(taskId),
    })
  }

  const uploadAttachmentMutation = useMutation({
    mutationFn: async (file: File) => {
      if (file.size === 0) {
        throw new Error('File is empty')
      }

      if (file.size > MAX_OBJECT_BYTES) {
        throw new Error('File exceeds maximum size')
      }

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
      await refreshAttachments()
      setHasSelectedFile(false)
      setValidationError(null)
      if (attachmentInputRef.current) {
        attachmentInputRef.current.value = ''
      }
    },
  })

  const deleteAttachmentMutation = useMutation({
    mutationFn: (attachmentId: string) =>
      deleteTaskAttachment(apiClient, taskId, attachmentId),
    onSuccess: refreshAttachments,
  })

  const downloadAttachmentMutation = useMutation({
    mutationFn: (attachment: { id: string; filename: string }) =>
      downloadTaskAttachment(apiClient, taskId, attachment.id).then(data => ({
        ...data,
        filename: attachment.filename,
      })),
    onSuccess: data => {
      downloadPresignedFile(data.data.downloadUrl, data.filename)
    },
  })

  const isMutationPending =
    uploadAttachmentMutation.isPending ||
    deleteAttachmentMutation.isPending ||
    downloadAttachmentMutation.isPending

  const activeError =
    uploadAttachmentMutation.error ??
    deleteAttachmentMutation.error ??
    downloadAttachmentMutation.error

  const error =
    validationError ??
    (activeError
      ? formatTreatyError(activeError, 'Something went wrong')
      : null)

  const attachmentsError = attachmentsQuery.isError
    ? formatTreatyError(attachmentsQuery.error, 'Failed to load attachments')
    : null

  function handleAttachmentFileChange(
    event: React.ChangeEvent<HTMLInputElement>,
  ) {
    uploadAttachmentMutation.reset()
    const file = event.target.files?.[0]

    if (!file) {
      setHasSelectedFile(false)
      setValidationError(null)
      return
    }

    setHasSelectedFile(true)

    if (file.size === 0) {
      setValidationError('File is empty')
      return
    }

    if (file.size > MAX_OBJECT_BYTES) {
      setValidationError('File exceeds maximum size')
      return
    }

    if (!isAllowedContentType(file.type)) {
      setValidationError('Unsupported file type')
      return
    }

    setValidationError(null)
  }

  function handleUploadAttachment() {
    const file = attachmentInputRef.current?.files?.[0]
    if (!file) {
      setValidationError('Choose a file first')
      return
    }

    if (file.size === 0) {
      setValidationError('File is empty')
      return
    }

    if (file.size > MAX_OBJECT_BYTES) {
      setValidationError('File exceeds maximum size')
      return
    }

    if (!isAllowedContentType(file.type)) {
      setValidationError('Unsupported file type')
      return
    }

    setValidationError(null)
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
        <div className="space-y-2">
          <InlineErrorCallout>{attachmentsError}</InlineErrorCallout>
          <Button
            onClick={() => attachmentsQuery.refetch()}
            type="button"
            variant="outline"
          >
            Try again
          </Button>
        </div>
      ) : null}
      {error ? (
        <div className="space-y-2">
          <InlineErrorCallout>{error}</InlineErrorCallout>
          {activeError ? (
            <Button
              onClick={resetMutationErrors}
              type="button"
              variant="outline"
            >
              Try again
            </Button>
          ) : null}
        </div>
      ) : null}
      {!(attachmentsQuery.isPending || attachmentsQuery.isError) &&
      attachments.length === 0 ? (
        <p className="text-muted-foreground text-sm">No attachments yet</p>
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
                disabled={isMutationPending}
                onClick={() =>
                  downloadAttachmentMutation.mutate({
                    id: attachment.id,
                    filename: attachment.filename,
                  })
                }
                size="sm"
                variant="outline"
              >
                Download
              </Button>
              <Button
                disabled={isMutationPending}
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
          onChange={handleAttachmentFileChange}
          ref={attachmentInputRef}
          type="file"
        />
        <Button
          disabled={
            !hasSelectedFile ||
            uploadAttachmentMutation.isPending ||
            validationError !== null
          }
          onClick={handleUploadAttachment}
          type="button"
        >
          Upload
        </Button>
      </div>
    </section>
  )
}
