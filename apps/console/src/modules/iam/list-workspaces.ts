import { iamClient } from '@/lib/iam-client'
import { readLastWorkspaceSlug } from '@/lib/last-workspace-cookie'

export interface WorkspaceSummary {
  id: string
  slug: string
}

export function mapOrganizationsToWorkspaces(
  organizations: Array<{ id: unknown; slug: unknown }> | null | undefined,
): WorkspaceSummary[] {
  return (
    organizations?.flatMap(org => {
      if (typeof org.id !== 'string' || typeof org.slug !== 'string') {
        return []
      }

      return [{ id: org.id, slug: org.slug }]
    }) ?? []
  )
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

  const workspaces = mapOrganizationsToWorkspaces(data)

  return { ok: true, workspaces }
}

/** Picks last-used cookie slug when still a member, otherwise the first workspace. */
export function pickSlugFromWorkspaces(
  workspaces: WorkspaceSummary[],
): string | null {
  if (workspaces.length === 0) {
    return null
  }

  const lastSlug = readLastWorkspaceSlug()
  const lastMatch = workspaces.find(ws => ws.slug === lastSlug)
  if (lastMatch) {
    return lastMatch.slug
  }

  return workspaces[0]?.slug ?? null
}

export async function resolveWorkspaceSlugById(
  workspaceId: string,
): Promise<string | null> {
  const listed = await listWorkspaces()
  if (!listed.ok) {
    return null
  }

  return listed.workspaces.find(ws => ws.id === workspaceId)?.slug ?? null
}

export async function pickDefaultWorkspaceSlug(): Promise<string | null> {
  const listed = await listWorkspaces()
  if (!listed.ok || listed.workspaces.length === 0) {
    return null
  }

  return pickSlugFromWorkspaces(listed.workspaces)
}
