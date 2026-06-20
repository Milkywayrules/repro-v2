import { env, iamFeatures } from '@repro-v2/env/api'

export function buildSocialProviders() {
  if (!iamFeatures.github) {
    return {}
  }

  if (!(env.IAM_GITHUB_CLIENT_ID && env.IAM_GITHUB_CLIENT_SECRET)) {
    throw new Error(
      'IAM_GITHUB_CLIENT_ID and IAM_GITHUB_CLIENT_SECRET are required when IAM_GITHUB_ENABLED is true',
    )
  }

  return {
    github: {
      clientId: env.IAM_GITHUB_CLIENT_ID,
      clientSecret: env.IAM_GITHUB_CLIENT_SECRET,
    },
  }
}
