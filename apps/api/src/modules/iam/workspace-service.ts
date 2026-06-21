import { db } from '@repro-v2/db'
import { and, eq } from '@repro-v2/db/drizzle'
import { member } from '@repro-v2/db/schema/auth'

import { forbiddenError } from '@/libs/contract/errors'

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

export const workspaceService = {
  assertMembership,
}
