import {
  attachmentCompleteBody,
  attachmentPresignBody,
  taskAttachmentPathParams,
  taskIdPathParams,
} from '@repro-v2/api-schemas/modules/attachments'
import { Elysia } from 'elysia'

import { http } from '@/libs/contract'
import { requireActiveWorkspace } from '@/modules/iam/require-active-workspace'

import { attachmentsService } from './attachments-service'

export const taskAttachmentsRoutes = new Elysia({
  name: 'task-attachments-routes',
})
  .use(requireActiveWorkspace)
  .get(
    '/:id/attachments',
    async ({ user, workspaceId, params }) => {
      const rows = await attachmentsService.listForTask(
        user.id,
        workspaceId,
        params.id,
      )
      return http.okV1(rows.map(attachmentsService.toResponse))
    },
    { params: taskIdPathParams },
  )
  .post(
    '/:id/attachments/presign',
    async ({ user, workspaceId, params, body }) => {
      const data = await attachmentsService.presignUpload(
        user.id,
        workspaceId,
        params.id,
        body,
      )
      return http.okV1(data)
    },
    { params: taskIdPathParams, body: attachmentPresignBody },
  )
  .post(
    '/:id/attachments/complete',
    async ({ user, workspaceId, params, body }) => {
      const row = await attachmentsService.completeUpload(
        user.id,
        workspaceId,
        params.id,
        body,
      )
      return http.okV1(attachmentsService.toResponse(row))
    },
    { params: taskIdPathParams, body: attachmentCompleteBody },
  )
  .get(
    '/:id/attachments/:attachmentId/download',
    async ({ user, workspaceId, params }) => {
      const data = await attachmentsService.presignDownload(
        user.id,
        workspaceId,
        params.id,
        params.attachmentId,
      )
      return http.okV1(data)
    },
    { params: taskAttachmentPathParams },
  )
  .delete(
    '/:id/attachments/:attachmentId',
    async ({ user, workspaceId, params }) => {
      const row = await attachmentsService.delete(
        user.id,
        workspaceId,
        params.id,
        params.attachmentId,
      )
      return http.okV1(attachmentsService.toResponse(row))
    },
    { params: taskAttachmentPathParams },
  )
