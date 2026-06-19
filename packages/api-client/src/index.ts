import { treaty } from '@elysiajs/eden'
import type { ErrorEnvelope } from '@repro-v2/api-types'
import { errorCodes, httpStatus } from '@repro-v2/api-types/constants'
import type { App } from 'api/app'

export function createApiClient(baseUrl: string) {
  return treaty<App>(baseUrl, {
    fetch: {
      credentials: 'include',
    },
    headers: {
      'X-Requested-With': 'XMLHttpRequest',
    },
  })
}

export type ApiClient = ReturnType<typeof createApiClient>

type TreatySuccess<T> = T extends { data?: infer D } ? NonNullable<D> : never

export type TaskListListResponse = TreatySuccess<
  Awaited<ReturnType<ApiClient['api']['v1']['task-lists']['get']>>
>
export type TaskList = TaskListListResponse['data'][number]

export type TaskListResponse = TreatySuccess<
  Awaited<ReturnType<ApiClient['api']['v1']['tasks']['get']>>
>
export type Task = TaskListResponse['data'][number]

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

export function isTreatyUnauthorized(error: unknown): boolean {
  if (!(error && typeof error === 'object')) {
    return false
  }

  if (
    'status' in error &&
    (error as { status?: number }).status === httpStatus.UNAUTHORIZED
  ) {
    return true
  }

  if ('value' in error) {
    const { value } = error as { value?: unknown }
    if (
      isErrorEnvelope(value) &&
      value.error.code === errorCodes.UNAUTHORIZED
    ) {
      return true
    }
  }

  return isErrorEnvelope(error) && error.error.code === errorCodes.UNAUTHORIZED
}

export function formatTreatyError(error: unknown, fallback: string): string {
  if (error && typeof error === 'object' && 'value' in error) {
    const { value } = error as { value?: unknown }
    if (isErrorEnvelope(value)) {
      return messageFromEnvelope(value) ?? fallback
    }
  }

  if (isErrorEnvelope(error)) {
    return messageFromEnvelope(error) ?? fallback
  }

  return fallback
}
