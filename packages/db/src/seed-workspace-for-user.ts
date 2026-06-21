import { and, eq } from 'drizzle-orm'

import { createId } from './id'
import type { createDb } from './index'
import { member, workspace } from './schema/auth'

function defaultWorkspaceName(userId: string): string {
  return `Seed workspace ${userId.slice(0, 8)}`
}

function defaultWorkspaceSlug(userId: string): string {
  return `seed-ws-${userId.slice(0, 8)}`
}

/**
 * Ensures the user has a workspace, creating one when none exist.
 * When the user already belongs to multiple workspaces, returns the first
 * membership row — pass an explicit `workspaceId` to `findWorkspaceForUser`
 * (e.g. via `SEED_WORKSPACE_ID`) instead of relying on this helper.
 */
export async function seedWorkspaceForUser(
  dbInstance: ReturnType<typeof createDb>,
  userId: string,
) {
  const [existingMembership] = await dbInstance
    .select({ workspaceId: member.workspace_id })
    .from(member)
    .where(eq(member.userId, userId))
    .limit(1)

  if (existingMembership) {
    return existingMembership.workspaceId
  }

  const workspaceId = createId()
  const createdAt = new Date()

  await dbInstance.insert(workspace).values({
    id: workspaceId,
    name: defaultWorkspaceName(userId),
    slug: defaultWorkspaceSlug(userId),
    ownerUserId: userId,
    createdAt,
  })

  await dbInstance.insert(member).values({
    id: createId(),
    workspace_id: workspaceId,
    userId,
    role: 'owner',
    createdAt,
  })

  return workspaceId
}

/**
 * Resolves a workspace the user belongs to.
 * Without `workspaceId`, returns the first membership — prefer an explicit id
 * when the user has multiple workspaces (set `SEED_WORKSPACE_ID` for seed).
 */
export async function findWorkspaceForUser(
  dbInstance: ReturnType<typeof createDb>,
  userId: string,
  workspaceId?: string,
) {
  if (workspaceId) {
    const [membership] = await dbInstance
      .select({ workspaceId: member.workspace_id })
      .from(member)
      .where(
        and(eq(member.userId, userId), eq(member.workspace_id, workspaceId)),
      )
      .limit(1)

    return membership?.workspaceId ?? null
  }

  const [membership] = await dbInstance
    .select({ workspaceId: member.workspace_id })
    .from(member)
    .where(eq(member.userId, userId))
    .limit(1)

  return membership?.workspaceId ?? null
}
