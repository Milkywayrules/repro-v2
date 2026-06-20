import { consoleLoginUrl } from '@/lib/console-login-url'
import { iamClient } from '@/lib/iam-client'

import { ApiReadyDot } from './api-ready-dot'
import { ApiTaskListsWidget } from './api-task-lists-widget'

export function PopupPage() {
  const { data: session, isPending: sessionPending } = iamClient.useSession()

  return (
    <main className="popup">
      <header className="popup-header">
        <ApiReadyDot />
      </header>

      <h1 className="popup-title">repro-v2</h1>

      {sessionPending ? (
        <p aria-live="polite" className="popup-muted" role="status">
          Checking session…
        </p>
      ) : null}

      {sessionPending || session?.user ? null : (
        <p>
          <a href={consoleLoginUrl} rel="noopener noreferrer" target="_blank">
            Sign in via Console (opens in new tab)
          </a>
        </p>
      )}

      {session?.user ? <ApiTaskListsWidget /> : null}
    </main>
  )
}
