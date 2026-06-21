import { db } from '@repro-v2/db'
import { and, eq, or, sql } from '@repro-v2/db/drizzle'
import { member, workspace } from '@repro-v2/db/schema/auth'
import {
  publicSlugFromStorageSlug,
  workspaceStorageSlug,
} from '@repro-v2/iam/workspace-storage-slug'

import {
  conflictError,
  forbiddenError,
  notFoundError,
} from '@/libs/contract/errors'

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

  if (matchingRows.length > 1) {
    throw conflictError(
      'Ambiguous workspace slug: multiple memberships match this slug for the user',
    )
  }

  const [row] = matchingRows
  if (!row) {
    throw notFoundError()
  }

  return row.workspaceId
}

export const workspaceService = {
  assertMembership,
  resolveWorkspaceIdForSlug,
}
