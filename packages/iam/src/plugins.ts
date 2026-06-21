import type { Db } from '@repro-v2/db'
import { captchaActive, env, iamFeatures } from '@repro-v2/env/api'
import type { BetterAuthPlugin } from 'better-auth'
import {
  captcha,
  magicLink,
  multiSession,
  organization,
} from 'better-auth/plugins'

import { buildCaptchaEndpoints } from './captcha-endpoints'
import type { IamEmailHandlers } from './email-hooks'
import { createWorkspaceCreateHooks } from './workspace-create-hooks'
import { WORKSPACE_LIMIT } from './workspace-limit'

const workspaceSchema = {
  organization: {
    modelName: 'workspace',
    additionalFields: {
      ownerUserId: {
        type: 'string',
        required: true,
        input: false,
      },
    },
  },
  member: {
    fields: {
      organizationId: 'workspace_id',
    },
  },
  invitation: {
    fields: {
      organizationId: 'workspace_id',
    },
  },
  session: {
    fields: {
      activeOrganizationId: 'active_workspace_id',
    },
  },
} as const

export function buildIamPlugins(
  db: Db,
  email: IamEmailHandlers | null,
): BetterAuthPlugin[] {
  const plugins: BetterAuthPlugin[] = []

  if (captchaActive && env.TURNSTILE_SECRET_KEY) {
    plugins.push(
      captcha({
        provider: 'cloudflare-turnstile',
        secretKey: env.TURNSTILE_SECRET_KEY,
        endpoints: buildCaptchaEndpoints(iamFeatures),
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
        organizationLimit: WORKSPACE_LIMIT,
        schema: workspaceSchema,
        sendInvitationEmail: email?.sendInvitationEmail,
        teams: { enabled: false },
        organizationHooks: createWorkspaceCreateHooks(db),
      }),
    )
  }

  return plugins
}
