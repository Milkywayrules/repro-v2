# apps/api

Elysia HTTP API for repro-v2. Entry: `src/index.ts` listens; `src/app.ts` exports `createApp()` and `type App`.

- Contract envelope + errors: `src/libs/contract/` — see [docs/contract.md](docs/contract.md)
- OpenAPI: `/openapi/` (Scalar), spec at `/openapi/json`
- Agent rules: [AGENTS.md](AGENTS.md); monorepo map in root [AGENTS.md](../../AGENTS.md)

```bash
bun run dev          # from apps/api
bun test src         # unit + integration tests
```
