import type { ReactNode } from 'react'

import { Body, Container, Head, Html, Preview } from '@react-email/components'

const main = {
  backgroundColor: '#f6f9fc',
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Ubuntu, sans-serif',
}

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '32px 24px',
  borderRadius: '8px',
  maxWidth: '480px',
}

interface EmailShellProps {
  children: ReactNode
  preview: string
}

export function EmailShell({ preview, children }: EmailShellProps) {
  return (
    <Html lang="en">
      <Head />
      <Body style={main}>
        <Preview>{preview}</Preview>
        <Container style={container}>{children}</Container>
      </Body>
    </Html>
  )
}
