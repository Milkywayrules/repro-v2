import { Button, Heading, Text } from '@react-email/components'

import { EmailShell } from './email-shell'

export interface WorkspaceInviteEmailProps {
  inviterName?: string
  inviteUrl: string
  workspaceName: string
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

export function WorkspaceInviteEmail({
  inviteUrl,
  workspaceName,
  inviterName,
}: WorkspaceInviteEmailProps) {
  const inviterLine = inviterName
    ? `${inviterName} invited you to join`
    : 'You have been invited to join'

  return (
    <EmailShell preview={`Join ${workspaceName} on Repro`}>
      <Heading style={heading}>Join {workspaceName}</Heading>
      <Text style={paragraph}>
        {inviterLine} the <strong>{workspaceName}</strong> workspace on Repro.
      </Text>
      <Button href={inviteUrl} style={button}>
        Accept invitation
      </Button>
      <Text style={paragraph}>
        If you were not expecting this invitation, you can ignore this email.
      </Text>
    </EmailShell>
  )
}

WorkspaceInviteEmail.PreviewProps = {
  inviteUrl: 'https://example.com/workspaces/invite?token=preview',
  workspaceName: 'Acme Labs',
  inviterName: 'Alex',
} satisfies WorkspaceInviteEmailProps
