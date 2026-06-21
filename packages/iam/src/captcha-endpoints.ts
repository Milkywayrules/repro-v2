export interface IamCaptchaFeatureFlags {
  captcha: boolean
  emailPassword: boolean
  github: boolean
  magicLink: boolean
  multiSession: boolean
  workspace: boolean
}

export function buildCaptchaEndpoints(
  features: IamCaptchaFeatureFlags,
): string[] {
  return [
    '/sign-up/email',
    '/sign-in/email',
    '/request-password-reset',
    ...(features.magicLink ? (['/sign-in/magic-link'] as const) : []),
    ...(features.github ? (['/sign-in/social'] as const) : []),
  ]
}
