import { createApiClient } from '@repro-v2/api-client'
import {
  readyQueryOptions,
  taskListQueryOptions,
} from '@repro-v2/api-client/queries'
import { env } from '@repro-v2/env/browser-ext'

export const apiClient = createApiClient(env.WXT_API_URL)

export const readyQuery = readyQueryOptions(apiClient)
export const taskListsQuery = taskListQueryOptions(apiClient)
