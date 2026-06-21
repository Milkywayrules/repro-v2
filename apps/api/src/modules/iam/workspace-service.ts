import { db } from '@repro-v2/db'
import { and, eq } from '@repro-v2/db/drizzle'
import { member, workspace } from '@repro-v2/db/schema/auth'

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
  const slug = workspaceSlug.trim().toLowerCase()

  const rows = await db
    .select({
      workspaceId: member.workspace_id,
      role: member.role,
      ownerUserId: workspace.ownerUserId,
    })
    .from(member)
    .innerJoin(workspace, eq(member.workspace_id, workspace.id))
    .where(and(eq(member.userId, userId), eq(workspace.slug, slug)))

  if (rows.length === 0) {
    throw notFoundError()
  }

  if (rows.length > 1) {
    throw conflictError(
      'Ambiguous workspace slug: multiple memberships match this slug for the user',
    )
  }

  const [row] = rows
  if (!row) {
    throw notFoundError()
  }

  return row.workspaceId
}

export const workspaceService = {
  assertMembership,
  resolveWorkspaceIdForSlug,
}
