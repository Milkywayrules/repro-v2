'use client'

import { useRef, useState } from 'react'

import {
  attachmentKeys,
  completeTaskAttachment,
  deleteTaskAttachment,
  downloadTaskAttachment,
  formatTreatyError,
  inspectUploadFile,
  presignTaskAttachment,
  taskAttachmentsQueryOptions,
  UPLOAD_HELPER_TEXT,
  uploadFileToPresignedUrl,
  validateUploadFile,
} from '@repro-v2/api-client/queries'
import { Button } from '@repro-v2/ui/components/button'
import { Input } from '@repro-v2/ui/components/input'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { InlineErrorCallout } from '@/components/inline-error-callout'
import { getApiClient } from '@/lib/api-client'

interface TaskAttachmentsPanelProps {
  taskId: string
  workspaceSlug?: string
}

type FailedAction = 'upload' | 'delete' | 'download'

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

export function TaskAttachmentsPanel({
  taskId,
  workspaceSlug,
}: TaskAttachmentsPanelProps) {
  const queryClient = useQueryClient()
  const client = getApiClient()
  const attachmentInputRef = useRef<HTMLInputElement>(null)
  const lastDeleteIdRef = useRef<string | null>(null)
  const lastDownloadRef = useRef<{ id: string; filename: string } | null>(null)
  const [hasSelectedFile, setHasSelectedFile] = useState(false)
  const [validationError, setValidationError] = useState<string | null>(null)
  const [failedAction, setFailedAction] = useState<FailedAction | null>(null)

  const attachmentsQuery = useQuery({
    ...taskAttachmentsQueryOptions(client, taskId, workspaceSlug),
    enabled: Boolean(taskId),
  })
  const attachments = attachmentsQuery.data?.data ?? []

  async function refreshAttachments() {
    await queryClient.invalidateQueries({
      queryKey: attachmentKeys.list(taskId, workspaceSlug),
    })
  }

  const uploadAttachmentMutation = useMutation({
    mutationFn: async (file: File) => {
      const inspected = inspectUploadFile(file)
      if ('error' in inspected) {
        throw new Error(inspected.error)
      }

      const presign = await presignTaskAttachment(
        client,
        taskId,
        inspected.meta,
        workspaceSlug,
      )
      await uploadFileToPresignedUrl(presign.data.uploadUrl, file)
      return await completeTaskAttachment(
        client,
        taskId,
        {
          key: presign.data.key,
          ...inspected.meta,
        },
        workspaceSlug,
      )
    },
    onSuccess: async () => {
      await refreshAttachments()
      setHasSelectedFile(false)
      setValidationError(null)
      setFailedAction(null)
      if (attachmentInputRef.current) {
        attachmentInputRef.current.value = ''
      }
    },
    onError: () => {
      setFailedAction('upload')
    },
  })

  const deleteAttachmentMutation = useMutation({
    mutationFn: (attachmentId: string) =>
      deleteTaskAttachment(client, taskId, attachmentId, workspaceSlug),
    onSuccess: async () => {
      await refreshAttachments()
      setFailedAction(null)
    },
    onError: () => {
      setFailedAction('delete')
    },
  })

  const downloadAttachmentMutation = useMutation({
    mutationFn: (attachment: { id: string; filename: string }) =>
      downloadTaskAttachment(client, taskId, attachment.id, workspaceSlug).then(
        data => ({
          ...data,
          filename: attachment.filename,
        }),
      ),
    onSuccess: data => {
      setFailedAction(null)
      downloadPresignedFile(data.data.downloadUrl, data.filename)
    },
    onError: () => {
      setFailedAction('download')
    },
  })

  function clearOtherMutationErrors(except: FailedAction) {
    if (except !== 'upload') {
      uploadAttachmentMutation.reset()
    }
    if (except !== 'delete') {
      deleteAttachmentMutation.reset()
    }
    if (except !== 'download') {
      downloadAttachmentMutation.reset()
    }
  }

  const isMutationPending =
    uploadAttachmentMutation.isPending ||
    deleteAttachmentMutation.isPending ||
    downloadAttachmentMutation.isPending

  const mutationError = (() => {
    if (failedAction === 'upload' && uploadAttachmentMutation.error) {
      return formatTreatyError(
        uploadAttachmentMutation.error,
        'Could not upload attachment',
      )
    }

    if (failedAction === 'delete' && deleteAttachmentMutation.error) {
      return formatTreatyError(
        deleteAttachmentMutation.error,
        'Could not delete attachment',
      )
    }

    if (failedAction === 'download' && downloadAttachmentMutation.error) {
      return formatTreatyError(
        downloadAttachmentMutation.error,
        'Could not download attachment',
      )
    }

    return null
  })()

  const error = validationError ?? mutationError

  const attachmentsError = attachmentsQuery.isError
    ? formatTreatyError(attachmentsQuery.error, 'Failed to load attachments')
    : null

  function handleAttachmentFileChange(
    event: React.ChangeEvent<HTMLInputElement>,
  ) {
    uploadAttachmentMutation.reset()
    setFailedAction(current => (current === 'upload' ? null : current))
    const file = event.target.files?.[0]

    if (!file) {
      setHasSelectedFile(false)
      setValidationError(null)
      return
    }

    setHasSelectedFile(true)
    setValidationError(validateUploadFile(file))
  }

  function handleUploadAttachment() {
    const file = attachmentInputRef.current?.files?.[0]
    if (!file) {
      setValidationError('Choose a file first')
      return
    }

    const fileError = validateUploadFile(file)
    if (fileError) {
      setValidationError(fileError)
      return
    }

    setValidationError(null)
    clearOtherMutationErrors('upload')
    setFailedAction(null)
    uploadAttachmentMutation.mutate(file)
  }

  function handleDeleteAttachment(attachmentId: string) {
    lastDeleteIdRef.current = attachmentId
    clearOtherMutationErrors('delete')
    setFailedAction(null)
    deleteAttachmentMutation.mutate(attachmentId)
  }

  function handleDownloadAttachment(attachment: {
    id: string
    filename: string
  }) {
    lastDownloadRef.current = attachment
    clearOtherMutationErrors('download')
    setFailedAction(null)
    downloadAttachmentMutation.mutate(attachment)
  }

  function handleRetryFailedAction() {
    if (validationError) {
      setValidationError(null)
      handleUploadAttachment()
      return
    }

    if (failedAction === 'upload') {
      handleUploadAttachment()
      return
    }

    if (failedAction === 'delete' && lastDeleteIdRef.current) {
      deleteAttachmentMutation.mutate(lastDeleteIdRef.current)
      return
    }

    if (failedAction === 'download' && lastDownloadRef.current) {
      downloadAttachmentMutation.mutate(lastDownloadRef.current)
    }
  }

  const canRetryFailedAction =
    validationError !== null ||
    (failedAction === 'upload' && uploadAttachmentMutation.error !== null) ||
    (failedAction === 'delete' && deleteAttachmentMutation.error !== null) ||
    (failedAction === 'download' && downloadAttachmentMutation.error !== null)

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
          {canRetryFailedAction ? (
            <Button
              onClick={handleRetryFailedAction}
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
                onClick={() => handleDownloadAttachment(attachment)}
                size="sm"
                variant="outline"
              >
                Download
              </Button>
              <Button
                disabled={isMutationPending}
                onClick={() => handleDeleteAttachment(attachment.id)}
                size="sm"
                variant="destructive"
              >
                Delete
              </Button>
            </div>
          </li>
        ))}
      </ul>
      <div className="flex flex-col gap-2">
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
        <p className="text-muted-foreground text-sm">{UPLOAD_HELPER_TEXT}</p>
      </div>
    </section>
  )
}
