import type { Db } from '@repro-v2/db'
import { captchaActive, env, iamFeatures } from '@repro-v2/env/api'
import type { BetterAuthPlugin } from 'better-auth'
import {
  captcha,
  magicLink,
  multiSession,
  organization,
} from 'better-auth/plugins'

import type { IamEmailHandlers } from './email-hooks'

const workspaceSchema = {
  organization: { modelName: 'workspace' },
} as const

export function buildIamPlugins(
  _db: Db,
  email: IamEmailHandlers | null,
): BetterAuthPlugin[] {
  const plugins: BetterAuthPlugin[] = []

  if (captchaActive && env.TURNSTILE_SECRET_KEY) {
    plugins.push(
      captcha({
        provider: 'cloudflare-turnstile',
        secretKey: env.TURNSTILE_SECRET_KEY,
        endpoints: [
          '/sign-up/email',
          '/sign-in/email',
          '/sign-in/social',
          '/request-password-reset',
          ...(iamFeatures.magicLink ? (['/sign-in/magic-link'] as const) : []),
        ],
      }),
    )
  }

  if (iamFeatures.multiSession) {
    plugins.push(multiSession())
  }

  if (iamFeatures.magicLink) {
    if (!email) {
      throw new Error(
        'EMAIL_RESEND_API_KEY is required when IAM_MAGIC_LINK_ENABLED is true',
      )
    }

    plugins.push(
      magicLink({
        sendMagicLink: email.sendMagicLink,
      }),
    )
  }

  if (iamFeatures.workspace) {
    plugins.push(
      organization({
        organizationLimit: 2,
        schema: workspaceSchema,
        sendInvitationEmail: email?.sendInvitationEmail,
        teams: { enabled: false },
      }),
    )
  }

  return plugins
}
