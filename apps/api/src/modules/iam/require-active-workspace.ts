import { activeWorkspaceId } from '@repro-v2/iam/session'
import { Elysia } from 'elysia'

import { forbiddenError, unauthorizedError } from '@/libs/contract/errors'

import { iamSession } from './context'
import { workspaceService } from './workspace-service'

/** Session-scoped workspace guard — used only when IAM_WORKSPACE_ENABLED is false. */
export const requireActiveWorkspace = new Elysia({
  name: 'require-active-workspace',
})
  .use(iamSession)
  .resolve({ as: 'scoped' }, async ({ iamSession: authSession }) => {
    if (!authSession) {
      throw unauthorizedError()
    }

    const { user, session } = authSession
    const workspaceId = activeWorkspaceId(session)

    if (!workspaceId) {
      throw forbiddenError()
    }

    await workspaceService.assertMembership(user.id, workspaceId)

    return { user, session, workspaceId }
  })
