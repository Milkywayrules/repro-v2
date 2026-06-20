import type { IamFeaturesResponse } from '@repro-v2/api-schemas/modules/platform'
import { captchaActive, iamFeatures } from '@repro-v2/env/api'

const publicFeatures: IamFeaturesResponse = {
  emailPassword: iamFeatures.emailPassword,
  magicLink: iamFeatures.magicLink,
  github: iamFeatures.github,
  captcha: captchaActive,
  workspace: iamFeatures.workspace,
  multiSession: iamFeatures.multiSession,
}

export const iamFeaturesService = {
  getPublicFeatures(): IamFeaturesResponse {
    return publicFeatures
  },
}
