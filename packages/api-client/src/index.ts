import { treaty } from '@elysiajs/eden'
import type { App } from 'api/app'

// biome-ignore lint/performance/noBarrelFile: intentional public surface re-exports
export {
  formatTreatyError,
  isTreatyUnauthorized,
} from './treaty-error'

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
