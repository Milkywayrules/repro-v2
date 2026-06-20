import type { ReactElement } from 'react'

import { render } from '@react-email/render'
import { Resend } from 'resend'

import { type EmailKind, type EmailSenderConfig, emailConfig } from './config'

export interface CreateEmailClientOptions {
  apiKey: string
}

export interface SendEmailParams {
  idempotencyKey?: string
  kind: EmailKind
  react: ReactElement
  subject: string
  to: string | string[]
}

export interface SendEmailSuccess {
  data: { id: string }
  ok: true
}

export interface SendEmailFailure {
  error: { message: string; name: string }
  ok: false
}

export type SendEmailResult = SendEmailSuccess | SendEmailFailure

export function createEmailClient({ apiKey }: CreateEmailClientOptions) {
  const resend = new Resend(apiKey)

  async function send(params: SendEmailParams): Promise<SendEmailResult> {
    const sender: EmailSenderConfig = emailConfig.senders[params.kind]
    const recipients = Array.isArray(params.to) ? params.to : [params.to]

    const html = await render(params.react)
    const text = await render(params.react, { plainText: true })

    const { data, error } = await resend.emails.send(
      {
        from: sender.from,
        ...(sender.replyTo ? { replyTo: sender.replyTo } : {}),
        to: recipients,
        subject: params.subject,
        html,
        text,
      },
      params.idempotencyKey
        ? { idempotencyKey: params.idempotencyKey }
        : undefined,
    )

    if (error) {
      return { ok: false, error }
    }

    if (!data?.id) {
      return {
        ok: false,
        error: { message: 'Resend returned no email id', name: 'resend_error' },
      }
    }

    return { ok: true, data: { id: data.id } }
  }

  return { send }
}
