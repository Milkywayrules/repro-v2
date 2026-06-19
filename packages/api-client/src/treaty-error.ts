import type { ErrorEnvelope } from '@repro-v2/api-types'
import { errorCodes, httpStatus } from '@repro-v2/api-types/constants'

function isErrorEnvelope(value: unknown): value is ErrorEnvelope {
  return (
    typeof value === 'object' &&
    value !== null &&
    'error' in value &&
    typeof (value as ErrorEnvelope).error?.message === 'string'
  )
}

function messageFromEnvelope(envelope: ErrorEnvelope): string | null {
  const message = envelope.error.message.trim()
  return message.length > 0 ? message : null
}

function treatyPayload(error: unknown): unknown {
  if (typeof error === 'object' && error !== null && 'value' in error) {
    return (error as { value?: unknown }).value
  }

  return error
}

function treatyStatus(error: unknown): number | undefined {
  if (typeof error === 'object' && error !== null && 'status' in error) {
    return (error as { status?: number }).status
  }

  return
}

export function isTreatyUnauthorized(error: unknown): boolean {
  const status = treatyStatus(error)
  if (status === httpStatus.UNAUTHORIZED) {
    return true
  }

  const payload = treatyPayload(error)
  if (
    isErrorEnvelope(payload) &&
    payload.error.code === errorCodes.UNAUTHORIZED
  ) {
    return true
  }

  return isErrorEnvelope(error) && error.error.code === errorCodes.UNAUTHORIZED
}

export function formatTreatyError(error: unknown, fallback: string): string {
  const payload = treatyPayload(error)
  if (isErrorEnvelope(payload)) {
    return messageFromEnvelope(payload) ?? fallback
  }

  if (isErrorEnvelope(error)) {
    return messageFromEnvelope(error) ?? fallback
  }

  return fallback
}
