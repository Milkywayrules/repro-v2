import { Button, Heading, Text } from '@react-email/components'

import { EmailShell } from './email-shell'

export interface IamPasswordResetEmailProps {
  resetUrl: string
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

export function IamPasswordResetEmail({
  resetUrl,
}: IamPasswordResetEmailProps) {
  return (
    <EmailShell preview="Reset your Repro password">
      <Heading style={heading}>Reset your password</Heading>
      <Text style={paragraph}>
        We received a request to reset the password for your Repro account.
      </Text>
      <Button href={resetUrl} style={button}>
        Reset password
      </Button>
      <Text style={paragraph}>
        This link expires soon. If you did not request a password reset, you can
        ignore this email.
      </Text>
    </EmailShell>
  )
}

IamPasswordResetEmail.PreviewProps = {
  resetUrl: 'https://example.com/auth/reset-password?token=preview',
} satisfies IamPasswordResetEmailProps
