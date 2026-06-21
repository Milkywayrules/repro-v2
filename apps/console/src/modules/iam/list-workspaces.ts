import { workspacePublicSlug } from '@repro-v2/iam/workspace-storage-slug'

import { iamClient } from '@/lib/iam-client'
import { readLastWorkspaceSlug } from '@/lib/last-workspace-cookie'

export interface WorkspaceSummary {
  id: string
  slug: string
}

interface OrganizationRecord {
  id: unknown
  metadata?: unknown
  ownerUserId?: unknown
  slug: unknown
}

export function mapOrganizationsToWorkspaces(
  organizations: OrganizationRecord[] | null | undefined,
): WorkspaceSummary[] {
  return (
    organizations?.flatMap(org => {
      if (typeof org.id !== 'string' || typeof org.slug !== 'string') {
        return []
      }

      const ownerUserId =
        typeof org.ownerUserId === 'string' ? org.ownerUserId : undefined

      return [
        {
          id: org.id,
          slug: workspacePublicSlug(org.slug, org.metadata, ownerUserId),
        },
      ]
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
