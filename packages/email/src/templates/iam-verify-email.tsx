import { Button, Heading, Text } from '@react-email/components'

import { EmailShell } from './email-shell'

export interface IamVerifyEmailProps {
  verificationUrl: string
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

export function IamVerifyEmail({ verificationUrl }: IamVerifyEmailProps) {
  return (
    <EmailShell preview="Verify your Repro email address">
      <Heading style={heading}>Verify your email</Heading>
      <Text style={paragraph}>
        Confirm your email address to finish setting up your Repro account.
      </Text>
      <Button href={verificationUrl} style={button}>
        Verify email
      </Button>
      <Text style={paragraph}>
        If you did not create a Repro account, you can ignore this message.
      </Text>
    </EmailShell>
  )
}

IamVerifyEmail.PreviewProps = {
  verificationUrl: 'https://example.com/auth/verify?token=preview',
} satisfies IamVerifyEmailProps
