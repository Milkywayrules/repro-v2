import type { Generator } from 'elysia-rate-limit'

function firstForwardedFor(request: Request): string | undefined {
  const forwarded = request.headers.get('x-forwarded-for')
  if (!forwarded) {
    return
  }

  const first = forwarded.split(',')[0]?.trim()
  return first || undefined
}

// X-Forwarded-For is only trustworthy when the edge proxy strips/spoofed
// client values and appends the real client IP (trusted proxy configuration).
export const proxyAwareClientKey: Generator = (request, server) => {
  const forwarded = firstForwardedFor(request)
  if (forwarded) {
    return forwarded
  }

  const clientAddress = server?.requestIP(request)?.address
  return clientAddress ?? 'unknown'
}
