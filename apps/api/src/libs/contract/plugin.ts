import { Elysia } from 'elysia'

import { resolveError } from './resolve'

export const errorHandler = new Elysia({ name: 'error-handler' }).onError(
  { as: 'global' },
  ({ code, error, status }) => {
    const { status: statusCode, body } = resolveError(code, error)

    return status(statusCode, body)
  },
)
