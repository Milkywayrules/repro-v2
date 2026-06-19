export const pagination = {
  defaultPage: 1,
  defaultPageSize: 20,
  maxPageSize: 100,
} as const

export const elysiaErrorCodes = {
  INVALID_COOKIE_SIGNATURE: 'INVALID_COOKIE_SIGNATURE',
  NOT_FOUND: 'NOT_FOUND',
  PARSE: 'PARSE',
  VALIDATION: 'VALIDATION',
} as const
