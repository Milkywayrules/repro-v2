import type { Db } from '@repro-v2/db'
import { eq } from '@repro-v2/db/drizzle'
import { member } from '@repro-v2/db/schema/auth'
import { seedDefaultTasksForUser } from '@repro-v2/db/seed-tasks-for-user'
import { env, iamFeatures } from '@repro-v2/env/api'

/**
 * Seeds disposable demo tasks when a user creates their first workspace.
 * Runs only in development — never in production.
 */
export function createDemoSeedOnFirstWorkspaceHook(db: Db) {
  return async ({
    organization,
    user,
  }: {
    organization: { id: string }
    user: { id: string }
  }) => {
    if (!(iamFeatures.workspace && env.NODE_ENV === 'development')) {
      return
    }

    const memberships = await db
      .select({ id: member.id })
      .from(member)
      .where(eq(member.userId, user.id))

    if (memberships.length !== 1) {
      return
    }

    await seedDefaultTasksForUser(db, user.id, organization.id)
  }
}
