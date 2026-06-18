import { treaty } from '@elysiajs/eden'
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
