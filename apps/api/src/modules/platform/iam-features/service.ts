import {
  IAM_FEATURE_KEYS,
  type IamFeatureFlagKey,
  type IamFeaturesResponse,
} from '@repro-v2/api-schemas/modules/platform'
import { captchaActive, iamFeatures } from '@repro-v2/env/api'

const featureFlagSources = {
  emailPassword: iamFeatures.emailPassword,
  magicLink: iamFeatures.magicLink,
  github: iamFeatures.github,
  captcha: captchaActive,
  workspace: iamFeatures.workspace,
  multiSession: iamFeatures.multiSession,
} satisfies Record<IamFeatureFlagKey, boolean>

export const iamFeaturesService = {
  getPublicFeatures(): IamFeaturesResponse {
    return Object.fromEntries(
      IAM_FEATURE_KEYS.map(key => [key, featureFlagSources[key]]),
    ) as IamFeaturesResponse
  },
}
