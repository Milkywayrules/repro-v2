import {
  createEmailClient,
  IamMagicLinkEmail,
  IamPasswordResetEmail,
  IamVerifyEmail,
  WorkspaceInviteEmail,
} from '@repro-v2/email'
import { corsOrigins, env } from '@repro-v2/env/api'

export interface IamEmailHandlers {
  sendInvitationEmail: (data: {
    email: string
    id: string
    organization: { name: string }
    inviter: { user: { name: string } }
  }) => Promise<void>
  sendMagicLink: (data: { email: string; url: string }) => Promise<void>
  sendResetPassword: (data: {
    url: string
    user: { email: string }
  }) => Promise<void>
  sendVerificationEmail: (data: {
    url: string
    user: { email: string }
  }) => Promise<void>
}

function consoleOrigin(): string {
  return corsOrigins[0] ?? env.IAM_BETTER_AUTH_URL
}

function assertEmailSent(
  result: Awaited<ReturnType<ReturnType<typeof createEmailClient>['send']>>,
  context: string,
): void {
  if (!result.ok) {
    throw new Error(`${context}: ${result.error.message}`)
  }
}

export function createIamEmailHandlers(): IamEmailHandlers | null {
  if (!env.EMAIL_RESEND_API_KEY) {
    return null
  }

  const email = createEmailClient({ apiKey: env.EMAIL_RESEND_API_KEY })

  return {
    sendMagicLink: async ({ email: to, url }) => {
      const result = await email.send({
        kind: 'iam.magic-link',
        react: <IamMagicLinkEmail magicLinkUrl={url} />,
        subject: 'Sign in to Repro',
        to,
      })
      assertEmailSent(result, 'Magic link email failed')
    },
    sendVerificationEmail: async ({ user, url }) => {
      const result = await email.send({
        kind: 'iam.verify-email',
        react: <IamVerifyEmail verificationUrl={url} />,
        subject: 'Verify your Repro email',
        to: user.email,
      })
      assertEmailSent(result, 'Verification email failed')
    },
    sendResetPassword: async ({ user, url }) => {
      const result = await email.send({
        kind: 'iam.password-reset',
        react: <IamPasswordResetEmail resetUrl={url} />,
        subject: 'Reset your Repro password',
        to: user.email,
      })
      assertEmailSent(result, 'Password reset email failed')
    },
    sendInvitationEmail: async ({ email: to, id, organization, inviter }) => {
      const inviteUrl = `${consoleOrigin()}/accept-invitation?id=${id}`
      const result = await email.send({
        kind: 'workspace.invite',
        react: (
          <WorkspaceInviteEmail
            inviterName={inviter.user.name}
            inviteUrl={inviteUrl}
            workspaceName={organization.name}
          />
        ),
        subject: `Join ${organization.name} on Repro`,
        to,
      })
      assertEmailSent(result, 'Workspace invitation email failed')
    },
  }
}
