export type EmailKind =
  | 'iam.magic-link'
  | 'iam.verify-email'
  | 'iam.password-reset'
  | 'workspace.invite'

export interface EmailSenderConfig {
  from: string
  replyTo?: string
}

const defaultFrom = 'Repro <onboarding@resend.dev>'

export const emailConfig = {
  senders: {
    'iam.magic-link': { from: defaultFrom },
    'iam.verify-email': { from: defaultFrom },
    'iam.password-reset': { from: defaultFrom },
    'workspace.invite': { from: defaultFrom },
  },
} satisfies { senders: Record<EmailKind, EmailSenderConfig> }
