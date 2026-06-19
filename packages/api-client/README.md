# @repro-v2/api-client

Typed HTTP client for the API via Eden Treaty (`createApiClient`).

- Imports `type App` from `api/app` (sole consumer of app types)
- Uses `@repro-v2/api-types/constants` for auth/error helpers
- Treaty helpers: `isTreatyUnauthorized`, `formatTreatyError`
- TanStack Query helpers: `@repro-v2/api-client/queries` (keys, query options, mutations)

Monorepo boundaries: root [AGENTS.md](../../AGENTS.md).
