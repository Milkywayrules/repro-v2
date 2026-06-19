import { treaty } from '@elysiajs/eden'
import type { ErrorEnvelope } from '@repro-v2/api-types'
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
