import { activeWorkspaceId } from './session'

export type EnsureActiveWorkspaceResult =
  | { ok: true; workspaceId: string }
  | {
      ok: false
      reason: 'no_session' | 'no_workspace' | 'error'
      error?: string
    }

export interface ActiveWorkspaceClient {
  getSession: () => Promise<{
    data: { session: unknown; user: unknown } | null
    error?: { message?: string } | null
  }>
  organization: {
    list: () => Promise<{
      data: Array<{ id: string }> | null
      error?: { message?: string } | null
    }>
    setActive: (input: {
      organizationId: string
    }) => Promise<{ error?: { message?: string } | null }>
  }
}

export async function ensureActiveWorkspace(
  client: ActiveWorkspaceClient,
): Promise<EnsureActiveWorkspaceResult> {
  const { data: sessionData, error: sessionError } = await client.getSession()

  if (sessionError || !sessionData) {
    return {
      ok: false,
      reason: 'no_session',
      error: sessionError?.message,
    }
  }

  const existing = activeWorkspaceId(sessionData.session)
  if (existing) {
    return { ok: true, workspaceId: existing }
  }

  const { data: organizations, error: listError } =
    await client.organization.list()

  if (listError) {
    return {
      ok: false,
      reason: 'error',
      error: listError.message ?? 'Could not load workspaces',
    }
  }

  const first = organizations?.[0]
  if (!first) {
    return { ok: false, reason: 'no_workspace' }
  }

  const { error: setError } = await client.organization.setActive({
    organizationId: first.id,
  })

  if (setError) {
    return {
      ok: false,
      reason: 'error',
      error: setError.message ?? 'Could not set active workspace',
    }
  }

  return { ok: true, workspaceId: first.id }
}
