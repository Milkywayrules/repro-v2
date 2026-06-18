// Infrastructure middleware — not part of the http contract surface.
import { Elysia } from 'elysia'

const REQUEST_ID_HEADER = 'X-Request-Id'
const requestIds = new WeakMap<Request, string>()

function resolveRequestId(request: Request): string {
  const incoming = request.headers.get(REQUEST_ID_HEADER)
  return incoming && incoming.length > 0 ? incoming : crypto.randomUUID()
}

function requestIdFor(request: Request): string {
  const existing = requestIds.get(request)
  if (existing) {
    return existing
  }

  const id = resolveRequestId(request)
  requestIds.set(request, id)
  return id
}

export const requestId = new Elysia({ name: 'request-id' })
  .derive({ as: 'global' }, ({ request }) => {
    const id = requestIdFor(request)
    return { requestId: id }
  })
  .onAfterHandle({ as: 'global' }, ({ request, set }) => {
    set.headers[REQUEST_ID_HEADER] = requestIdFor(request)
  })
  .onError({ as: 'global' }, ({ request, set }) => {
    set.headers[REQUEST_ID_HEADER] = requestIdFor(request)
  })
