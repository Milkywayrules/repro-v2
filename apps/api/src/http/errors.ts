import { env } from '@repro-v2/env/api'
import { Elysia, ValidationError } from 'elysia'
import { EvlogError } from 'evlog'

import { ERROR_CODES, ERROR_MESSAGES, HTTP_STATUS } from './constants'
import { type ErrorEnvelope, fail } from './response'

interface ResolvedError {
  body: ErrorEnvelope
  status: number
}

export class RateLimitExceededError extends Error {
  readonly status = HTTP_STATUS.TOO_MANY_REQUESTS

  constructor() {
    super(ERROR_MESSAGES.RATE_LIMIT_EXCEEDED)
    this.name = 'RateLimitExceededError'
  }
}

function getValidationMessage(error: ValidationError): string {
  const first = error.all[0]
  return first?.summary ?? first?.message ?? error.message
}

function getValidationDetails(error: ValidationError, production: boolean) {
  if (production) {
    return
  }

  return error.all.map(({ path, message, summary }) => ({
    path,
    message: summary ?? message,
  }))
}

function resolveRateLimitError(): ResolvedError {
  return {
    status: HTTP_STATUS.TOO_MANY_REQUESTS,
    body: fail({
      code: ERROR_CODES.RATE_LIMIT_EXCEEDED,
      message: ERROR_MESSAGES.RATE_LIMIT_EXCEEDED,
    }),
  }
}

function resolveEvlogError(
  error: EvlogError,
  production: boolean,
): ResolvedError {
  const isServerError = error.status >= HTTP_STATUS.INTERNAL_SERVER_ERROR

  if (isServerError && production) {
    return {
      status: error.status,
      body: {
        error: {
          code: ERROR_CODES.INTERNAL_SERVER_ERROR,
          message: ERROR_MESSAGES.INTERNAL_SERVER_ERROR,
        },
      },
    }
  }

  return {
    status: error.status,
    body: {
      error: {
        ...error.data,
        code: error.code ?? ERROR_CODES.UNKNOWN_ERROR,
        message: error.message,
      },
    },
  }
}

function resolveNotFoundMessage(error: unknown): string {
  if (error instanceof Error && error.message !== 'NOT_FOUND') {
    return error.message
  }

  return ERROR_MESSAGES.NOT_FOUND
}

export function resolveError(
  code: string | number,
  error: unknown,
  options: { isProduction?: boolean } = {},
): ResolvedError {
  const production = options.isProduction ?? env.NODE_ENV === 'production'

  if (error instanceof RateLimitExceededError) {
    return resolveRateLimitError()
  }

  if (error instanceof EvlogError) {
    return resolveEvlogError(error, production)
  }

  switch (String(code)) {
    case 'NOT_FOUND':
      return {
        status: HTTP_STATUS.NOT_FOUND,
        body: {
          error: {
            code: ERROR_CODES.NOT_FOUND,
            message: production
              ? ERROR_MESSAGES.NOT_FOUND
              : resolveNotFoundMessage(error),
          },
        },
      }

    case 'VALIDATION':
      if (error instanceof ValidationError) {
        const details = getValidationDetails(error, production)

        return {
          status: HTTP_STATUS.UNPROCESSABLE_ENTITY,
          body: {
            error: {
              code: ERROR_CODES.VALIDATION_ERROR,
              message: getValidationMessage(error),
              ...(details ? { details } : {}),
            },
          },
        }
      }
      break

    case 'PARSE':
      return {
        status: HTTP_STATUS.BAD_REQUEST,
        body: {
          error: {
            code: ERROR_CODES.PARSE_ERROR,
            message: ERROR_MESSAGES.PARSE_ERROR,
          },
        },
      }

    case 'INVALID_COOKIE_SIGNATURE':
      return {
        status: HTTP_STATUS.UNAUTHORIZED,
        body: {
          error: {
            code: ERROR_CODES.INVALID_COOKIE,
            message: ERROR_MESSAGES.INVALID_COOKIE,
          },
        },
      }

    default:
      break
  }

  const message =
    error instanceof Error
      ? error.message
      : ERROR_MESSAGES.INTERNAL_SERVER_ERROR

  return {
    status: HTTP_STATUS.INTERNAL_SERVER_ERROR,
    body: {
      error: {
        code: ERROR_CODES.INTERNAL_SERVER_ERROR,
        message: production ? ERROR_MESSAGES.INTERNAL_SERVER_ERROR : message,
      },
    },
  }
}

export const errorHandler = new Elysia({ name: 'error-handler' }).onError(
  { as: 'global' },
  ({ code, error, status }) => {
    const { status: statusCode, body } = resolveError(code, error)

    return status(statusCode, body)
  },
)

export function methodNotAllowedResponse() {
  return fail({
    code: ERROR_CODES.METHOD_NOT_ALLOWED,
    message: ERROR_MESSAGES.METHOD_NOT_ALLOWED,
  })
}
