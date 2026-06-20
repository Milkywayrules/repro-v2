import type { Db } from '@repro-v2/db'
import { createId } from '@repro-v2/db/id'
import { member, workspace } from '@repro-v2/db/schema/auth'
import { seedDefaultTasksForUser } from '@repro-v2/db/seed-tasks-for-user'
import { env, iamFeatures } from '@repro-v2/env/api'

function defaultWorkspaceName(user: { email: string; name: string }): string {
  const trimmedName = user.name.trim()
  if (trimmedName.length > 0) {
    return `${trimmedName}'s workspace`
  }

  const localPart = user.email.split('@')[0] ?? 'user'
  return `${localPart}'s workspace`
}

function defaultWorkspaceSlug(userId: string): string {
  return `ws-${userId.slice(0, 8)}`
}

export function createUserCreatedHook(db: Db) {
  return async (user: { email: string; id: string; name: string }) => {
    if (env.NODE_ENV === 'development') {
      await seedDefaultTasksForUser(db, user.id)
    }

    if (!iamFeatures.workspace) {
      return
    }

    const workspaceId = createId()
    const createdAt = new Date()

    await db.insert(workspace).values({
      id: workspaceId,
      name: defaultWorkspaceName(user),
      slug: defaultWorkspaceSlug(user.id),
      createdAt,
    })

    await db.insert(member).values({
      id: createId(),
      organizationId: workspaceId,
      userId: user.id,
      role: 'owner',
      createdAt,
    })
  }
}
