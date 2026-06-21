import type { Db } from '@repro-v2/db'
import { and, eq, or } from '@repro-v2/db/drizzle'
import { workspace } from '@repro-v2/db/schema/auth'
import { APIError } from 'better-auth/api'

import { isReservedWorkspaceSlug } from './reserved-workspace-slugs'
import {
  parseWorkspaceMetadata,
  publicSlugFromStorageSlug,
  workspaceStorageSlug,
} from './workspace-storage-slug'

function workspaceSlugTakenMessage(): string {
  return 'A workspace with this URL already exists on your account'
}

function reservedSlugMessage(): string {
  return 'This workspace URL is reserved. Choose a different name.'
}

function resolvePublicSlug(
  organization: { slug?: string; metadata?: unknown },
  ownerUserId: string,
): string {
  const fromMetadata = parseWorkspaceMetadata(organization.metadata).publicSlug
  if (fromMetadata) {
    return fromMetadata
  }

  const slug = organization.slug?.trim().toLowerCase()
  if (!slug) {
    return ''
  }

  return publicSlugFromStorageSlug(slug, ownerUserId)
}

function buildWorkspaceMetadata(
  existing: unknown,
  publicSlug: string,
): Record<string, string> {
  return {
    ...parseWorkspaceMetadata(existing),
    publicSlug,
  }
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
      const publicSlug = resolvePublicSlug(organization, user.id)

      if (!publicSlug) {
        throw new APIError('BAD_REQUEST', {
          message: 'Workspace URL is required',
        })
      }

      if (isReservedWorkspaceSlug(publicSlug)) {
        throw new APIError('BAD_REQUEST', {
          message: reservedSlugMessage(),
        })
      }

      const storageSlug = workspaceStorageSlug(user.id, publicSlug)

      const [existing] = await db
        .select({ id: workspace.id })
        .from(workspace)
        .where(
          and(
            eq(workspace.ownerUserId, user.id),
            or(eq(workspace.slug, storageSlug), eq(workspace.slug, publicSlug)),
          ),
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
          slug: storageSlug,
          metadata: buildWorkspaceMetadata(organization.metadata, publicSlug),
          ownerUserId: user.id,
        },
      }
    },
  }
}
