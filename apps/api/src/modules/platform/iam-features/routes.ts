import { iamFeaturesOkV1Response } from '@repro-v2/api-schemas/modules/platform'
import { Elysia } from 'elysia'

import { http } from '@/libs/contract'

import { iamFeaturesService } from './service'

export const iamFeaturesRoutes = new Elysia({
  name: 'iam-features-routes',
}).get('/', () => http.okV1(iamFeaturesService.getPublicFeatures()), {
  response: {
    200: iamFeaturesOkV1Response,
  },
  detail: {
    security: [],
    summary: 'Public IAM feature flags',
  },
})
