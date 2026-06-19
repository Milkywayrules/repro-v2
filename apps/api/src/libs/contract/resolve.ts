import type { ErrorEnvelope } from '@repro-v2/api-types/contract'
import { env } from '@repro-v2/env/api'
import { ValidationError } from 'elysia'
import { EvlogError } from 'evlog'

import {
  elysiaErrorCodes,
  errorCodes,
  errorMessages,
  httpStatus,
} from './constants'
import { fail } from './response'

interface ResolvedError {
  body: ErrorEnvelope
  status: number
}

export class RateLimitExceededError extends Error {
  readonly status = httpStatus.TOO_MANY_REQUESTS

  constructor() {
    super(errorMessages.RATE_LIMIT_EXCEEDED)
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
    status: httpStatus.TOO_MANY_REQUESTS,
    body: fail({
      code: errorCodes.RATE_LIMIT_EXCEEDED,
      message: errorMessages.RATE_LIMIT_EXCEEDED,
    }),
  }
}

function resolveEvlogError(
  error: EvlogError,
  production: boolean,
): ResolvedError {
  const isServerError = error.status >= httpStatus.INTERNAL_SERVER_ERROR

  if (isServerError && production) {
    return {
      status: error.status,
      body: {
        error: {
          code: errorCodes.INTERNAL_SERVER_ERROR,
          message: errorMessages.INTERNAL_SERVER_ERROR,
        },
      },
    }
  }

  return {
    status: error.status,
    body: {
      error: {
        ...error.data,
        code: error.code ?? errorCodes.UNKNOWN_ERROR,
        message: error.message,
      },
    },
  }
}

function resolveNotFoundMessage(error: unknown): string {
  if (error instanceof Error && error.message !== elysiaErrorCodes.NOT_FOUND) {
    return error.message
  }

  return errorMessages.NOT_FOUND
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
    case elysiaErrorCodes.NOT_FOUND:
      return {
        status: httpStatus.NOT_FOUND,
        body: {
          error: {
            code: errorCodes.NOT_FOUND,
            message: production
              ? errorMessages.NOT_FOUND
              : resolveNotFoundMessage(error),
          },
        },
      }

    case elysiaErrorCodes.VALIDATION:
      if (error instanceof ValidationError) {
        const details = getValidationDetails(error, production)

        return {
          status: httpStatus.UNPROCESSABLE_ENTITY,
          body: {
            error: {
              code: errorCodes.VALIDATION_ERROR,
              message: getValidationMessage(error),
              ...(details ? { details } : {}),
            },
          },
        }
      }
      break

    case elysiaErrorCodes.PARSE:
      return {
        status: httpStatus.BAD_REQUEST,
        body: {
          error: {
            code: errorCodes.PARSE_ERROR,
            message: errorMessages.PARSE_ERROR,
          },
        },
      }

    case elysiaErrorCodes.INVALID_COOKIE_SIGNATURE:
      return {
        status: httpStatus.UNAUTHORIZED,
        body: {
          error: {
            code: errorCodes.INVALID_COOKIE,
            message: errorMessages.INVALID_COOKIE,
          },
        },
      }

    default:
      break
  }

  const message =
    error instanceof Error ? error.message : errorMessages.INTERNAL_SERVER_ERROR

  return {
    status: httpStatus.INTERNAL_SERVER_ERROR,
    body: {
      error: {
        code: errorCodes.INTERNAL_SERVER_ERROR,
        message: production ? errorMessages.INTERNAL_SERVER_ERROR : message,
      },
    },
  }
}
