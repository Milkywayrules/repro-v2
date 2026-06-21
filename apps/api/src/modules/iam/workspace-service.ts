import { db } from '@repro-v2/db'
import { and, eq, or, sql } from '@repro-v2/db/drizzle'
import { member, workspace } from '@repro-v2/db/schema/auth'
import {
  publicSlugFromStorageSlug,
  workspaceStorageSlug,
} from '@repro-v2/iam/workspace-storage-slug'

import { forbiddenError, notFoundError } from '@/libs/contract/errors'

async function assertMembership(userId: string, workspaceId: string) {
  const [row] = await db
    .select({ id: member.id })
    .from(member)
    .where(and(eq(member.userId, userId), eq(member.workspace_id, workspaceId)))
    .limit(1)

  if (!row) {
    throw forbiddenError()
  }
}

async function resolveWorkspaceIdForSlug(
  userId: string,
  workspaceSlug: string,
) {
  const publicSlug = workspaceSlug.trim().toLowerCase()
  const storageSlug = workspaceStorageSlug(userId, publicSlug)

  const rows = await db
    .select({
      workspaceId: member.workspace_id,
      role: member.role,
      ownerUserId: workspace.ownerUserId,
      slug: workspace.slug,
      metadata: workspace.metadata,
      createdAt: workspace.createdAt,
    })
    .from(member)
    .innerJoin(workspace, eq(member.workspace_id, workspace.id))
    .where(
      and(
        eq(member.userId, userId),
        or(
          eq(workspace.slug, publicSlug),
          eq(workspace.slug, storageSlug),
          sql`${workspace.slug} = concat(${workspace.ownerUserId}, ':', ${publicSlug})`,
        ),
      ),
    )

  const matchingRows = rows.filter(
    row => publicSlugFromStorageSlug(row.slug, row.ownerUserId) === publicSlug,
  )

  if (matchingRows.length === 0) {
    throw notFoundError()
  }

  const row = pickWorkspaceRowForSlug(matchingRows, userId)
  if (!row) {
    throw notFoundError()
  }

  return row.workspaceId
}

interface WorkspaceSlugRow {
  createdAt: Date
  ownerUserId: string
  workspaceId: string
}

function pickWorkspaceRowForSlug(
  matchingRows: WorkspaceSlugRow[],
  userId: string,
): WorkspaceSlugRow | undefined {
  const ownedRows = matchingRows.filter(row => row.ownerUserId === userId)
  const candidates = ownedRows.length > 0 ? ownedRows : matchingRows

  if (candidates.length === 1) {
    return candidates[0]
  }

  return candidates.toSorted((left, right) => {
    const createdAtDiff = left.createdAt.getTime() - right.createdAt.getTime()
    if (createdAtDiff !== 0) {
      return createdAtDiff
    }

    return left.workspaceId.localeCompare(right.workspaceId)
  })[0]
}

export const workspaceService = {
  assertMembership,
  resolveWorkspaceIdForSlug,
}
