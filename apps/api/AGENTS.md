# apps/api — agent instructions

Scoped rules for this app. Root `AGENTS.md` applies otherwise.

## Layout

- `src/index.ts` — app bootstrap and plugin wiring only (no business logic).
- `src/libs/` — reusable in-app libraries (contract, middleware).
- `src/libs/contract/` — response contract; public API is `http` (see `docs/contract.md`).
- `src/libs/middleware/` — cross-cutting Elysia plugins (rate-limit, request-id).
- `src/features/` — cohesive HTTP features (health probes, auth mount, future domains).
- `docs/` — human + agent documentation for API conventions.

## Import rules (apps/api only)

- **Barrel re-exports are allowed** under `apps/api/src/` for ergonomics (e.g.: `libs/contract/index.ts` → `export { http } from './http'`).
- Route/feature code imports public surfaces only (e.g. `http` from `libs/contract`, middleware from `libs/middleware`).
- Prefer barrels over deep internal imports when a barrel exists.

## Validation & tests

- **Zod** for env, bodies, query params — not Elysia TypeBox.
- **`bun:test`** first for unit and integration tests in this app.

## API versioning

- One contract per `/api/vN/` prefix.
- Use `http.okV1(data, meta?)` in versioned routes — merges `apiVersion` automatically.
- Breaking change → new prefix (`/api/v2/`), not per-resource versions.
