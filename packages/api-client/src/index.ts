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

interface WorkspaceV1Api {
  workspaces: (params: { workspaceSlug: string }) => {
    'task-lists': {
      get: () => Promise<{ data: unknown; error: unknown }>
      post: (body: {
        name: string
      }) => Promise<{ data: unknown; error: unknown }>
      (params: {
        id: string
      }): {
        get: () => Promise<{ data: unknown; error: unknown }>
        patch: (body: {
          name?: string
        }) => Promise<{ data: unknown; error: unknown }>
        delete: () => Promise<{ data: unknown; error: unknown }>
      }
    }
    tasks: {
      get: (options: {
        query: { listId: string }
      }) => Promise<{ data: unknown; error: unknown }>
      post: (body: {
        title: string
        listId: string
      }) => Promise<{ data: unknown; error: unknown }>
      (params: {
        id: string
      }): {
        get: () => Promise<{ data: unknown; error: unknown }>
        patch: (body: {
          completed?: boolean
          title?: string
        }) => Promise<{ data: unknown; error: unknown }>
        delete: () => Promise<{ data: unknown; error: unknown }>
        attachments: {
          get: () => Promise<{ data: unknown; error: unknown }>
          presign: {
            post: (body: unknown) => Promise<{ data: unknown; error: unknown }>
          }
          complete: {
            post: (body: unknown) => Promise<{ data: unknown; error: unknown }>
          }
          (params: {
            attachmentId: string
          }): {
            download: {
              get: () => Promise<{ data: unknown; error: unknown }>
            }
            delete: () => Promise<{ data: unknown; error: unknown }>
          }
        }
      }
    }
  }
}

type FlatTaskListsApi = ReturnType<WorkspaceV1Api['workspaces']>['task-lists']
type FlatTasksApi = ReturnType<WorkspaceV1Api['workspaces']>['tasks']

interface FlatV1Api {
  'task-lists': FlatTaskListsApi
  tasks: FlatTasksApi
}

function workspaceV1(client: ApiClient): WorkspaceV1Api {
  return client.api.v1 as unknown as WorkspaceV1Api
}

function flatV1(client: ApiClient): FlatV1Api {
  return client.api.v1 as unknown as FlatV1Api
}

/** Resolves workspace-scoped v1 task routes. */
export function workspaceTaskApi(client: ApiClient, workspaceSlug: string) {
  return workspaceV1(client).workspaces({ workspaceSlug })
}

/** Task list API — workspace-prefixed when slug is set, flat otherwise. */
export function taskListsApi(client: ApiClient, workspaceSlug?: string) {
  if (workspaceSlug) {
    return workspaceTaskApi(client, workspaceSlug)['task-lists']
  }

  return flatV1(client)['task-lists']
}

/** Tasks API — workspace-prefixed when slug is set, flat otherwise. */
export function tasksApi(client: ApiClient, workspaceSlug?: string) {
  if (workspaceSlug) {
    return workspaceTaskApi(client, workspaceSlug).tasks
  }

  return flatV1(client).tasks
}

export interface TaskListListResponse {
  data: Array<{ id: string; name: string }>
  meta?: { apiVersion?: string; pagination?: { type: string; total?: number } }
}

export interface TaskListItemResponse {
  data: { id: string; name: string }
  meta?: { apiVersion?: string }
}

export type TaskList = TaskListListResponse['data'][number]

export interface TaskListResponse {
  data: Array<{ id: string; title: string; completed: boolean; listId: string }>
  meta?: { apiVersion?: string; pagination?: { type: string; total?: number } }
}

export type Task = TaskListResponse['data'][number]
