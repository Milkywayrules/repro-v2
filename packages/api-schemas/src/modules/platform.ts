import { z } from 'zod'

import { okV1Envelope } from '../shared/envelope'

const iamFeatureShape = {
  emailPassword: z.boolean(),
  magicLink: z.boolean(),
  github: z.boolean(),
  captcha: z.boolean(),
  workspace: z.boolean(),
  multiSession: z.boolean(),
} as const

export const iamFeaturesResponse = z.object(iamFeatureShape)
export const iamFeaturesOkV1Response = okV1Envelope(iamFeaturesResponse)

export type IamFeatureFlagKey = keyof typeof iamFeatureShape
export type IamFeaturesResponse = z.infer<typeof iamFeaturesResponse>
