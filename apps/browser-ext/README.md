# browser-ext

WXT + React MV3 extension. Reference wiring for `@repro-v2/api-client`, `@repro-v2/iam/react`, and platform probes.

Popup: session gate via Console login link, `GET /ready` dot, authenticated `GET /api/v1/task-lists` (read-only).

Chrome + Firefox are first-class targets (`wxt.config.ts` `targetBrowsers`). Dev: `dev` / `dev:firefox`; build: `build` / `build:firefox`. Root smoke: `bun run smoke`.
