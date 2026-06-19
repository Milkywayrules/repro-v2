import { corsOrigins } from '@repro-v2/env/api'
import { Elysia } from 'elysia'

import { http } from '@/libs/contract'

const STATE_CHANGING_METHODS = new Set(['POST', 'PATCH', 'DELETE'])
const AJAX_REQUEST_HEADER = 'x-requested-with'
const AJAX_REQUEST_VALUE = 'xmlhttprequest'

function isAllowedOrigin(origin: string): boolean {
  return corsOrigins.includes(origin)
}

function refererOrigin(referer: string): string | null {
  try {
    return new URL(referer).origin
  } catch {
    return null
  }
}

function rejectDisallowedOrigin(): never {
  throw http.error({
    code: http.codes.FORBIDDEN,
    message: http.messages.FORBIDDEN,
    status: http.status.FORBIDDEN,
  })
}

function validateStateChangingOrigin(request: Request): void {
  const origin = request.headers.get('origin')
  if (origin !== null) {
    if (!isAllowedOrigin(origin)) {
      rejectDisallowedOrigin()
    }
    return
  }

  const referer = request.headers.get('referer')
  if (referer !== null) {
    const parsedRefererOrigin = refererOrigin(referer)
    if (parsedRefererOrigin !== null) {
      if (!isAllowedOrigin(parsedRefererOrigin)) {
        rejectDisallowedOrigin()
      }
      return
    }
  }

  const requestedWith = request.headers.get(AJAX_REQUEST_HEADER)
  if (requestedWith?.toLowerCase() !== AJAX_REQUEST_VALUE) {
    rejectDisallowedOrigin()
  }
}

export const csrfOriginValidation = new Elysia({
  name: 'csrf-origin-validation',
}).onRequest(({ request }) => {
  const { pathname } = new URL(request.url)

  if (!pathname.startsWith('/api/v1')) {
    return
  }

  if (!STATE_CHANGING_METHODS.has(request.method)) {
    return
  }

  validateStateChangingOrigin(request)
})
