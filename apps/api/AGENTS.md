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
    task-lists/         # reference CRUD — routes.ts, service.ts
    tasks/              # reference CRUD — routes.ts, service.ts; soft delete via deletedAt
  routes/
    platform/index.ts   # .use(healthRoutes)
    auth/index.ts       # .use(authModuleRoutes) at /api/auth
    v1/index.ts         # requireAuth + task-lists + tasks + GET / okV1
  libs/
    contract/           # response contract + errors; public API is http
    helpers/            # serialize-audit and other small utilities
    middleware/         # rate-limit, request-id
    queries/            # paginatedList glue (parse → db → buildMeta)
  docs/                 # API conventions (contract.md)
```

No `features/` folder. No `routes/v1.ts` stub file — versioned lanes live in `routes/v1/index.ts`.

## Imports

- Use `@/` path alias (`@/libs/contract`, `@/modules/auth`, `@/platform/health`, …).
- Barrels allowed under `apps/api/src/`.
- Route/feature code imports public surfaces only.
- **Do not** depend on `drizzle-orm` directly — import operators/types from `@repro-v2/db/drizzle`, schema from `@repro-v2/db/schema/*`, and `db` from `@repro-v2/db`.

## Modules & services

- Each module under `modules/*` exports a **service object** from `service.ts` (e.g. `taskListsService`, `tasksService`, `authService`).
- Methods may be defined outside the object or inlined — export one object, not individual functions.
- Routes and cross-module callers import the service object and call through it (`taskListsService.list(...)`, not `import { list } from './service'`).
- Query/business logic lives in `service.ts`; HTTP wiring stays in `routes.ts`.

## Validation & tests

- **Zod** for env, bodies, query params — not Elysia TypeBox.
- Request validation schemas live in `@repro-v2/api-schemas` (`modules/*`, `shared/id`); routes import from there.
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
- Scalar UI at `/openapi/`; spec at `/openapi/json` (absolute URL in Scalar config).
- Regenerate committed spec via root `bun run generate:openapi`.

## Plugin order (app.ts)

1. Request ID
2. CORS (`exposedHeaders: ['X-Request-Id']`) — before platform + v1 so probes get CORS headers
3. Platform probes (`routes/platform`)
4. Evlog logging
5. Error handler (`http.plugin()`)
6. Global rate limit
7. Auth identify derive (evlog)
8. OpenAPI
9. Auth routes, v1 routes, root GET /

## Dev server

- Use `bun --watch` (not `--hot`) for `dev` — Elysia does not stop the previous listener on hot reload, which leaves ghost processes on `:5000` and breaks CORS until stale PIDs are killed.

## Soft delete (tasks reference)

- Tasks use `deletedAt` / `deletedById` audit columns — list/get filter `deletedAt IS NULL`.
- DELETE sets `deletedAt` rather than hard delete.
- Deleting a task list also soft-deletes its child tasks.

## Deploy / database (Railway)

- **`db:push` in `railway.json` preDeploy is ACCEPTED** until staging hardening — intentional, not a bug. Do not switch to `db:migrate` until the migration workflow is finalized.

## Rate limiting (proxy)

- `globalRateLimit` / `authRateLimit` use `proxyAwareClientKey` (`X-Forwarded-For` first, then `server.requestIP`) for Railway/reverse-proxy client identity.

## App boundary (type-only exception)

- **`apps/api/src/app.ts` exports `type App`** — the only app source other apps may reference for types.
- **`@repro-v2/api-client`** is the sole consumer: `import type { App } from 'api/app'`.
- **No app→app imports** (console must not import from `apps/api/src/*`).
- **No tsconfig path cheats** to reach sibling app source (no `"../api/src/*"` in console paths).
- Frontends use `@repro-v2/api-client` and `@repro-v2/auth/react`; contract types from `@repro-v2/api-types/contract`.
