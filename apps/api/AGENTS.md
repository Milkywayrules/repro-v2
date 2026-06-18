# apps/api — agent instructions

Scoped rules for this app. Root `AGENTS.md` applies otherwise.

## Layout

```
src/
  index.ts              # listen bootstrap only (imports createApp from app.ts)
  app.ts                # createApp() + export type App
  lifecycle.ts          # graceful shutdown
  platform/health/      # liveness/readiness probes (plain JSON, no envelope)
  modules/
    auth/               # routes.ts (better-auth mount + requireAuth), service.ts
    task-lists/         # reference CRUD — routes.ts, service.ts, schemas in service
    tasks/              # reference CRUD — soft delete via deletedAt
  routes/
    platform/index.ts   # .use(healthRoutes)
    auth/index.ts       # .use(authModuleRoutes) at /api/auth
    v1/index.ts         # requireAuth + task-lists + tasks + GET / okV1
  libs/
    contract/           # response contract; public API is http
    middleware/         # rate-limit, request-id
    queries/            # paginatedList glue (parse → db → buildMeta)
  docs/                 # API conventions (contract.md)
```

No `features/` folder. No `routes/v1.ts` stub file — versioned lanes live in `routes/v1/index.ts`.

## Imports

- Use `@/` path alias (`@/libs/contract`, `@/modules/auth`, `@/platform/health`, …).
- Barrels allowed under `apps/api/src/`.
- Route/feature code imports public surfaces only.

## Validation & tests

- **Zod** for env, bodies, query params — not Elysia TypeBox.
- Pass Zod schemas directly to Elysia route config (Standard Schema).
- **`bun:test`** first for unit and integration tests in this app.

## API versioning

- One contract per `/api/vN/` prefix.
- Use `http.okV1(data, meta?)` in versioned routes — merges `apiVersion` automatically.
- Breaking change → new prefix (`/api/v2/`), not per-resource versions.

## Auth

- `authSession` global derive resolves the session once per request; `requireAuth` reuses it via `.resolve()`.
- better-auth handler at `/api/auth/*` — native response shape, not our envelope.
- User-scoped modules read `{ user }` from context; never trust client-supplied user ids.
- `modules/auth/auth.ts` wires `createAuth(db)` with the shared `@repro-v2/db` pool — auth must not call `createDb()` again.
- evlog user identification in `app.ts` reads the same `authSession` derive.

## OpenAPI

- `@elysiajs/openapi` registered in `app.ts`; exclude `/health`, `/ready`, `/api/auth/*`.
- `mapJsonSchema: { zod: z.toJSONSchema }` for Zod 4.
- Spec at `/openapi/json`; regenerate types via root `bun run generate:api-types`.

## Plugin order (app.ts)

1. Platform probes (`routes/platform`)
2. Request ID
3. Evlog logging
4. Error handler (`http.plugin()`)
5. Global rate limit
6. Auth identify derive (evlog)
7. CORS (`exposedHeaders: ['X-Request-Id']`)
8. OpenAPI
9. Auth routes, v1 routes, root GET /

## Soft delete (tasks reference)

- Tasks use `deletedAt` / `deletedById` audit columns — list/get filter `deletedAt IS NULL`.
- DELETE sets `deletedAt` rather than hard delete.
- Deleting a task list also soft-deletes its child tasks.

## Deploy / database (Railway)

- **`db:push` in `railway.json` preDeploy is ACCEPTED** until staging hardening — intentional, not a bug. Do not switch to `db:migrate` until the migration workflow is finalized.

## Rate limiting (proxy)

- `globalRateLimit` / `authRateLimit` use `proxyAwareClientKey` (`X-Forwarded-For` first, then `server.requestIP`) for Railway/reverse-proxy client identity.
