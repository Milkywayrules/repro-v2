import { iamClient } from '@/lib/iam-client'

export interface WorkspaceSummary {
  id: string
}

export type ListWorkspacesResult =
  | { ok: true; workspaces: WorkspaceSummary[] }
  | { ok: false; error: string }

export async function listWorkspaces(): Promise<ListWorkspacesResult> {
  const { data, error } = await iamClient.organization.list()

  if (error) {
    return {
      ok: false,
      error: error.message ?? 'Could not load workspaces',
    }
  }

  return { ok: true, workspaces: data ?? [] }
}
