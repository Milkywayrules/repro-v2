import { Button, Heading, Text } from '@react-email/components'

import { EmailShell } from './email-shell'

export interface IamMagicLinkEmailProps {
  magicLinkUrl: string
}

const heading = {
  color: '#111827',
  fontSize: '24px',
  fontWeight: 700,
  lineHeight: '32px',
  margin: '0 0 16px',
}

const paragraph = {
  color: '#374151',
  fontSize: '16px',
  lineHeight: '24px',
  margin: '0 0 16px',
}

const button = {
  backgroundColor: '#111827',
  borderRadius: '6px',
  color: '#ffffff',
  display: 'inline-block',
  fontSize: '16px',
  fontWeight: 600,
  lineHeight: '24px',
  padding: '12px 20px',
  textDecoration: 'none',
}

export function IamMagicLinkEmail({ magicLinkUrl }: IamMagicLinkEmailProps) {
  return (
    <EmailShell preview="Sign in to Repro with your magic link">
      <Heading style={heading}>Sign in to Repro</Heading>
      <Text style={paragraph}>
        Use the button below to sign in. This link expires soon and can only be
        used once.
      </Text>
      <Button href={magicLinkUrl} style={button}>
        Sign in
      </Button>
      <Text style={paragraph}>
        If you did not request this email, you can safely ignore it.
      </Text>
    </EmailShell>
  )
}

IamMagicLinkEmail.PreviewProps = {
  magicLinkUrl: 'https://example.com/auth/magic-link?token=preview',
} satisfies IamMagicLinkEmailProps
