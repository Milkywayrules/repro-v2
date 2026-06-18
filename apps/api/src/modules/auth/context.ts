import { Elysia } from 'elysia'

import { shouldSkipAuthContext } from './paths'
import { getSession } from './service'

export const authSession = new Elysia({ name: 'auth-session' }).derive(
  { as: 'global' },
  async ({ request }) => {
    const pathname = new URL(request.url).pathname

    if (shouldSkipAuthContext(pathname)) {
      return { authSession: null }
    }

    return {
      authSession: await getSession(request.headers),
    }
  },
)
