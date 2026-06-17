import { env } from '@repro-v2/env/api'
import { rateLimit } from 'elysia-rate-limit'

const isDev = env.NODE_ENV === 'development'
const devMultiplier = isDev ? env.RATE_LIMIT_DEV_MULTIPLIER : 1

function createRateLimitResponse(): Response {
  return new Response(
    JSON.stringify({
      error: 'Too many requests',
      message: 'Rate limit exceeded. Please try again later.',
    }),
    {
      status: 429,
      headers: { 'Content-Type': 'application/json' },
    },
  )
}

function shouldSkipPreflight(request: Request): boolean {
  return request.method === 'OPTIONS'
}

export const globalRateLimit = rateLimit({
  duration: env.RATE_LIMIT_GLOBAL_DURATION_MS,
  max: env.RATE_LIMIT_GLOBAL_MAX * devMultiplier,
  errorResponse: createRateLimitResponse(),
  countFailedRequest: false,
  skip: request => {
    if (shouldSkipPreflight(request)) {
      return true
    }

    const { pathname } = new URL(request.url)
    return pathname === '/' || pathname.startsWith('/api/auth')
  },
})

export const authRateLimit = rateLimit({
  duration: env.RATE_LIMIT_AUTH_DURATION_MS,
  max: env.RATE_LIMIT_AUTH_MAX * devMultiplier,
  errorResponse: createRateLimitResponse(),
  countFailedRequest: true,
  scoping: 'scoped',
  skip: request => shouldSkipPreflight(request),
})
