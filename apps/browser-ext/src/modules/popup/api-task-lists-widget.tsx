import {
  isTreatyUnauthorized,
  type TaskListListResponse,
} from '@repro-v2/api-client'
import { useQuery } from '@tanstack/react-query'

import { taskListsQuery } from '@/lib/api-client'
import { consoleLoginUrl } from '@/lib/console-login-url'
import { iamClient } from '@/lib/iam-client'

function treatyErrorPayload(error: unknown): unknown {
  if (typeof error === 'object' && error !== null && 'value' in error) {
    return (error as { value?: unknown }).value
  }

  return error
}

function serializeQueryError(error: unknown): string {
  const payload = treatyErrorPayload(error)

  try {
    return JSON.stringify(
      payload ?? { error: { message: 'Request failed' } },
      null,
      2,
    )
  } catch {
    return String(error)
  }
}

interface ApiTaskListsWidgetProps {
  workspaceError: string | null
  workspaceReady: boolean
  workspaceSlug: string | null
}

export function ApiTaskListsWidget({
  workspaceError,
  workspaceReady,
  workspaceSlug,
}: ApiTaskListsWidgetProps) {
  const { data: session } = iamClient.useSession()

  const { data, isPending, isError, error } = useQuery({
    ...taskListsQuery(workspaceSlug ?? undefined),
    enabled: Boolean(session?.user && workspaceReady && workspaceSlug),
  })

  if (workspaceError) {
    return (
      <p className="popup-muted" role="alert">
        {workspaceError}
      </p>
    )
  }

  if (!workspaceReady || isPending) {
    return (
      <p aria-live="polite" className="popup-muted" role="status">
        Loading task lists…
      </p>
    )
  }

  if (isError) {
    if (isTreatyUnauthorized(error)) {
      return (
        <p>
          <a href={consoleLoginUrl} rel="noopener noreferrer" target="_blank">
            Sign in via Console (opens in new tab)
          </a>
        </p>
      )
    }

    return (
      <pre className="error-dump" role="alert">
        {serializeQueryError(error)}
      </pre>
    )
  }

  const lists = (data as TaskListListResponse | undefined)?.data ?? []

  if (lists.length === 0) {
    return <p className="popup-muted">No task lists</p>
  }

  return (
    <section aria-label="Task lists">
      <ul className="task-list">
        {lists.map(list => (
          <li key={list.id}>{list.name}</li>
        ))}
      </ul>
    </section>
  )
}
