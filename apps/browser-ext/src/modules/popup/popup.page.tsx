import { env } from '@repro-v2/env/browser-ext'

import { authClient } from '@/lib/auth-client'
import { routes } from '@/lib/routes'

import { ApiReadyDot } from './api-ready-dot'
import { ApiTaskListsWidget } from './api-task-lists-widget'

const consoleLoginUrl = new URL(routes.login, env.WXT_CONSOLE_URL).href

export function PopupPage() {
  const { data: session, isPending: sessionPending } = authClient.useSession()

  return (
    <div className="popup">
      <header className="popup-header">
        <ApiReadyDot />
      </header>

      {sessionPending ? <p className="popup-muted">Checking session…</p> : null}

      {sessionPending || session?.user ? null : (
        <p>
          <a href={consoleLoginUrl} rel="noopener" target="_blank">
            Sign in via Console
          </a>
        </p>
      )}

      {session?.user ? <ApiTaskListsWidget /> : null}
    </div>
  )
}
