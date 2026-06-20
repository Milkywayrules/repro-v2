import { Elysia } from 'elysia'

import { shouldSkipIamContext } from './paths'
import { iamService } from './service'

export const iamSession = new Elysia({ name: 'iam-session' }).derive(
  { as: 'global' },
  async ({ request }) => {
    const pathname = new URL(request.url).pathname

    if (shouldSkipIamContext(pathname)) {
      return { iamSession: null }
    }

    return {
      iamSession: await iamService.getSession(request.headers),
    }
  },
)
