import { isTreatyUnauthorized } from '@repro-v2/api-client'
import { taskListQueryOptions } from '@repro-v2/api-client/queries'
import { env } from '@repro-v2/env/browser-ext'
import { useQuery } from '@tanstack/react-query'

import { apiClient } from '@/lib/api-client'
import { routes } from '@/lib/routes'

const consoleLoginUrl = new URL(routes.login, env.WXT_CONSOLE_URL).href

function serializeQueryError(error: unknown): string {
  try {
    return JSON.stringify(error, null, 2)
  } catch {
    return String(error)
  }
}

export function ApiTaskListsWidget() {
  const { data, isPending, isError, error } = useQuery(
    taskListQueryOptions(apiClient),
  )

  if (isPending) {
    return <p className="popup-muted">Loading task lists…</p>
  }

  if (isError) {
    if (isTreatyUnauthorized(error)) {
      return (
        <p>
          <a href={consoleLoginUrl} rel="noopener" target="_blank">
            Sign in via Console
          </a>
        </p>
      )
    }

    return <pre className="error-dump">{serializeQueryError(error)}</pre>
  }

  const lists = data?.data ?? []

  if (lists.length === 0) {
    return <p className="popup-muted">No task lists</p>
  }

  return (
    <ul className="task-list">
      {lists.map(list => (
        <li key={list.id}>{list.name}</li>
      ))}
    </ul>
  )
}
