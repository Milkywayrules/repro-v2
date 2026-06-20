import { consoleHomeUrl, consoleLoginUrl } from '@/lib/console-login-url'
import { iamClient } from '@/lib/iam-client'
import { useEnsureActiveWorkspace } from '@/lib/use-ensure-active-workspace'
import { useIamFeatures } from '@/lib/use-iam-features'

import { ApiReadyDot } from './api-ready-dot'
import { ApiTaskListsWidget } from './api-task-lists-widget'

export function PopupPage() {
  const { data: session, isPending: sessionPending } = iamClient.useSession()
  const { features } = useIamFeatures()
  const { data: organizations } = iamClient.useListOrganizations()
  const {
    error: workspaceError,
    isReady: workspaceReady,
    workspaceId,
  } = useEnsureActiveWorkspace(session?.user?.id)

  const workspaceName = organizations?.find(org => org.id === workspaceId)?.name

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

      {session?.user ? (
        <section aria-label="Signed in account" className="popup-account">
          <p className="popup-account-name">{session.user.name}</p>
          <p className="popup-muted">{session.user.email}</p>
          {features?.workspace && workspaceName ? (
            <p className="popup-muted">Workspace: {workspaceName}</p>
          ) : null}
          <p>
            <a href={consoleHomeUrl} rel="noopener noreferrer" target="_blank">
              Open Console
            </a>
          </p>
          {features?.multiSession ? (
            <p className="popup-muted">
              Switch sessions from the account menu in Console.
            </p>
          ) : null}
        </section>
      ) : null}

      {sessionPending || session?.user ? null : (
        <p>
          <a href={consoleLoginUrl} rel="noopener noreferrer" target="_blank">
            Sign in via Console (opens in new tab)
          </a>
        </p>
      )}

      {session?.user ? (
        <ApiTaskListsWidget
          workspaceError={workspaceError}
          workspaceReady={workspaceReady}
        />
      ) : null}
    </main>
  )
}
