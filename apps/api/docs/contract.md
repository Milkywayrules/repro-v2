# API contract

Concise guide for response shape, pagination, and plugin wiring in `apps/api`.

## Public surface: `http`

Import from `libs/contract` (barrel re-exports `http`):

```ts
import { http } from '@/libs/contract'
// or relative from src/app.ts: import { http } from './libs/contract'
// adjust path depth from your module
```

| Member                                       | Purpose                                                           |
| -------------------------------------------- | ----------------------------------------------------------------- |
| `http.ok(data, meta?)`                       | Success envelope `{ data, meta? }`                                |
| `http.okV1(data, meta?)`                     | Same as `ok`, merges `{ apiVersion: http.api.VERSION }` into meta |
| `http.error({ code, message, status, ... })` | Evlog application error (via `createError`)                       |
| `http.codes`                                 | Stable error code strings (`@repro-v2/api-types/constants`)       |
| `http.messages`                              | Default user-facing messages (`@repro-v2/api-types/constants`)    |
| `http.status`                                | HTTP status constants (re-exported from `@repro-v2/api-types/constants`) |
| `http.api`                                   | API metadata (`VERSION`)                                          |
| `http.pagination`                            | Query parsing and meta builders (see below)                       |
| `http.plugin()`                              | Global error handler Elysia plugin                                |

## Envelopes

**Success** — all `/api/vN/` routes and non-auth product routes:

```json
{ "data": { ... }, "meta": { "apiVersion": "1", "pagination": { ... } } }
```

**Error** — thrown via `http.error` or mapped by the error plugin:

```json
{ "error": { "code": "NOT_FOUND", "message": "Resource not found" } }
```

## Exceptions (no envelope)

| Route                       | Shape                                 |
| --------------------------- | ------------------------------------- |
| `GET /health`, `GET /ready` | Plain JSON probes (`platform/health`) |
| `POST/GET /api/auth/*`      | better-auth native responses          |

## Versioned routes: `okV1`

Use `http.okV1` in `/api/v1/` handlers — no manual `apiVersion` in meta:

```ts
.group('/api/v1', app =>
  app.get('/items', () => http.okV1(items, { pagination: meta })),
)
```

Breaking changes → new prefix (`/api/v2/`), not per-resource versions.

## List route recipe

```ts
.get('/items', ({ request }) => {
  const params = new URL(request.url).searchParams
  const { page, pageSize } = http.pagination.offset.parse(params)
  const filters = http.pagination.filters.parse(params, ['status'])
  const sort = http.pagination.sort.parse(params, ['name', 'createdAt'])
  const offset = http.pagination.offset.toSql(page, pageSize)

  // ... query DB with offset, filters, sort ...

  return http.okV1(rows, {
    pagination: http.pagination.offset.buildMeta(page, pageSize, total),
    filters,
    sort,
  })
})
```

**Pagination namespace**

- `defaults` — `{ page, pageSize, maxPageSize }`
- `offset.parse`, `offset.buildMeta`, `offset.toSql`
- `cursor.parse`, `cursor.buildMeta`
- `filters.parse`, `sort.parse`

Internal helpers live in `libs/contract/list.ts`; route code uses `http.pagination` only.

## Plugin order

From `app.ts` — order matters:

1. Platform probes (`routes/platform` → `platform/health`)
2. Request ID (`libs/middleware/request-id`)
3. Evlog logging
4. Error handler (`http.plugin()`)
5. Global rate limit
6. Auth identify derive (evlog)
7. CORS (`exposedHeaders: ['X-Request-Id']`)
8. OpenAPI
9. Auth routes, v1 routes, root `GET /`

CORS `onRequest` runs before handlers; error responses set `set.status` so CORS headers still apply.

## Tests

- Use `bun:test` (`describe`, `test`, `expect`).
- Assert contract values via `http.codes`, `http.messages`, `http.status` — not raw constants imports.
- Route validation: **Zod** schemas from `@repro-v2/api-schemas` (no Elysia TypeBox).
