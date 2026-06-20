import { isTreatyUnauthorized } from '@repro-v2/api-client'
import { taskListQueryOptions } from '@repro-v2/api-client/queries'
import { useQuery } from '@tanstack/react-query'

import { apiClient } from '@/lib/api-client'
import { getConsoleLoginUrl } from '@/lib/console-login-url'

const consoleLoginUrl = getConsoleLoginUrl()

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

export function ApiTaskListsWidget() {
  const { data, isPending, isError, error } = useQuery(
    taskListQueryOptions(apiClient),
  )

  if (isPending) {
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

  const lists = data?.data ?? []

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
