import { workspaceSlugParams } from '@repro-v2/api-schemas/modules/workspace'
import { Elysia } from 'elysia'

import { unauthorizedError } from '@/libs/contract/errors'

import { iamSession } from './context'
import { workspaceService } from './workspace-service'

const workspacePathPattern = /\/workspaces\/([^/]+)/

function resolveWorkspaceSlug(params: unknown, request: Request): string {
  const fromParams = workspaceSlugParams.safeParse(params)
  if (fromParams.success) {
    return fromParams.data.workspaceSlug
  }

  const match = new URL(request.url).pathname.match(workspacePathPattern)
  if (match?.[1]) {
    return decodeURIComponent(match[1])
  }

  return workspaceSlugParams.parse(params).workspaceSlug
}

export const requireWorkspaceFromPath = new Elysia({
  name: 'require-workspace-from-path',
})
  .use(iamSession)
  .resolve(
    { as: 'scoped' },
    async ({ iamSession: authSession, params, request }) => {
      if (!authSession) {
        throw unauthorizedError()
      }

      const { user, session } = authSession
      const workspaceSlug = resolveWorkspaceSlug(params, request)
      const workspaceId = await workspaceService.resolveWorkspaceIdForSlug(
        user.id,
        workspaceSlug,
      )

      return { user, session, workspaceId, workspaceSlug }
    },
  )
