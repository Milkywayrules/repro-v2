import type { Db } from '@repro-v2/db'
import { and, eq } from '@repro-v2/db/drizzle'
import { workspace } from '@repro-v2/db/schema/auth'
import { APIError } from 'better-auth/api'

import { isReservedWorkspaceSlug } from './reserved-workspace-slugs'

function workspaceSlugTakenMessage(): string {
  return 'A workspace with this URL already exists on your account'
}

function reservedSlugMessage(): string {
  return 'This workspace URL is reserved. Choose a different name.'
}

export function createWorkspaceCreateHooks(db: Db) {
  return {
    beforeCreateOrganization: async ({
      organization,
      user,
    }: {
      organization: { slug?: string; name?: string; metadata?: unknown }
      user: { id: string }
    }) => {
      const slug = organization.slug?.trim().toLowerCase()

      if (!slug) {
        throw new APIError('BAD_REQUEST', {
          message: 'Workspace URL is required',
        })
      }

      if (isReservedWorkspaceSlug(slug)) {
        throw new APIError('BAD_REQUEST', {
          message: reservedSlugMessage(),
        })
      }

      const [existing] = await db
        .select({ id: workspace.id })
        .from(workspace)
        .where(
          and(eq(workspace.ownerUserId, user.id), eq(workspace.slug, slug)),
        )
        .limit(1)

      if (existing) {
        throw new APIError('BAD_REQUEST', {
          message: workspaceSlugTakenMessage(),
        })
      }

      return {
        data: {
          ...organization,
          slug,
          ownerUserId: user.id,
        },
      }
    },
  }
}
