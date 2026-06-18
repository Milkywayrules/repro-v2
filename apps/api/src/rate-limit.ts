import { env } from '@repro-v2/env/api'
import { rateLimit } from 'elysia-rate-limit'

import { RateLimitExceededError } from './http/errors'

const rateLimitExceededError = new RateLimitExceededError()

const isDev = env.NODE_ENV === 'development'
const devMultiplier = isDev ? env.RATE_LIMIT_DEV_MULTIPLIER : 1

function shouldSkipPreflight(request: Request): boolean {
  return request.method === 'OPTIONS'
}

export const globalRateLimit = rateLimit({
  duration: env.RATE_LIMIT_GLOBAL_DURATION_MS,
  max: env.RATE_LIMIT_GLOBAL_MAX * devMultiplier,
  errorResponse: rateLimitExceededError,
  countFailedRequest: false,
  skip: request => {
    if (shouldSkipPreflight(request)) {
      return true
    }

    const { pathname } = new URL(request.url)
    return (
      pathname === '/health' ||
      pathname === '/ready' ||
      pathname.startsWith('/api/auth')
    )
  },
})

export const authRateLimit = rateLimit({
  duration: env.RATE_LIMIT_AUTH_DURATION_MS,
  max: env.RATE_LIMIT_AUTH_MAX * devMultiplier,
  errorResponse: rateLimitExceededError,
  countFailedRequest: true,
  scoping: 'scoped',
  skip: request => shouldSkipPreflight(request),
})
