import {
  avatarCompleteBody,
  avatarPresignBody,
} from '@repro-v2/api-schemas/modules/me'
import { Elysia } from 'elysia'

import { http } from '@/libs/contract'
import { requireIam } from '@/modules/iam/routes'

import { meService } from './service'

export const meRoutes = new Elysia({ name: 'me-routes' })
  .use(requireIam)
  .post(
    '/avatar/presign',
    async ({ user, body }) => {
      const data = await meService.presignAvatar(user.id, body)
      return http.okV1(data)
    },
    { body: avatarPresignBody },
  )
  .post(
    '/avatar/complete',
    async ({ user, body }) => {
      const data = await meService.completeAvatar(
        user.id,
        body.key,
        body.sizeBytes,
      )
      return http.okV1(data)
    },
    { body: avatarCompleteBody },
  )
