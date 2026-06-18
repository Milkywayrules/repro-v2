import type { ErrorEnvelope } from '@repro-v2/api-types'

function isErrorEnvelope(value: unknown): value is ErrorEnvelope {
  return (
    typeof value === 'object' &&
    value !== null &&
    'error' in value &&
    typeof (value as ErrorEnvelope).error?.message === 'string'
  )
}

export function formatTreatyError(error: unknown, fallback: string): string {
  if (error && typeof error === 'object' && 'value' in error) {
    const { value } = error as { value?: unknown }
    if (isErrorEnvelope(value)) {
      return value.error.message
    }
  }

  if (isErrorEnvelope(error)) {
    return error.error.message
  }

  return fallback
}
