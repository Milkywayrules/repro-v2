export const httpStatus = {
  OK: 200,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  NOT_FOUND: 404,
  METHOD_NOT_ALLOWED: 405,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
  FORBIDDEN: 403,
} as const

export const errorCodes = {
  FORBIDDEN: 'FORBIDDEN',
  INTERNAL_SERVER_ERROR: 'INTERNAL_SERVER_ERROR',
  INVALID_COOKIE: 'INVALID_COOKIE',
  METHOD_NOT_ALLOWED: 'METHOD_NOT_ALLOWED',
  NOT_FOUND: 'NOT_FOUND',
  UNAUTHORIZED: 'UNAUTHORIZED',
  PARSE_ERROR: 'PARSE_ERROR',
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  UNKNOWN_ERROR: 'UNKNOWN_ERROR',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
} as const

export const errorMessages = {
  DATABASE_UNAVAILABLE: 'Database unavailable',
  FORBIDDEN: 'Forbidden',
  INTERNAL_SERVER_ERROR: 'Internal server error',
  UNAUTHORIZED: 'Authentication required',
  INVALID_COOKIE: 'Invalid or tampered session cookie',
  METHOD_NOT_ALLOWED: 'Method not allowed',
  NOT_FOUND: 'Resource not found',
  PARSE_ERROR: 'Invalid request body',
  RATE_LIMIT_EXCEEDED: 'Rate limit exceeded. Please try again later.',
} as const

export const api = {
  CONTENT_TYPE_JSON: 'application/json; charset=utf-8',
  VERSION: '1',
} as const
