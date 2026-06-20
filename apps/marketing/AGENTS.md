# apps/marketing — agent instructions

Scoped rules for this app. Root `AGENTS.md` applies otherwise.

## Stack & port

- Next.js 16 App Router, React 19, `reactCompiler: true`, Tailwind v4
- Port **5002** (`dev`, `start:local`)
- Root Ultracite/Biome — no local `biome.json`; no `test` script
- `check-types` = `next typegen && tsc --noEmit`

## Layout

```
src/
  app/
    layout.tsx          # metadata + Providers
    page.tsx            # thin shell → HomePage
  modules/home/         # home.page.tsx, api-health-badge.tsx
  components/providers.tsx
  lib/api-client.ts
  index.css             # @import @repro-v2/ui/globals.css
components.json         # shadcn → @repro-v2/ui (style base-lyra)
```

Single landing page today. New routes: add `modules/<domain>/*.page.tsx` + thin `app/**/page.tsx`.

## Use

| Concern     | Package / pattern                                                      |
| ----------- | ---------------------------------------------------------------------- |
| API         | `@repro-v2/api-client` — `createApiClient(env.NEXT_PUBLIC_API_URL)`    |
| Health UI   | `readyQueryOptions(apiClient)` — platform `/ready` badge               |
| Cross-links | env URLs: `NEXT_PUBLIC_CONSOLE_URL`, `NEXT_PUBLIC_DOCS_URL`            |
| UI          | `@repro-v2/ui/components/*` per `components.json`; Geist fonts         |
| Providers   | `@repro-v2/ui/providers/app-providers` (theme, query, toaster)         |
| Env         | `@repro-v2/env/marketing` — import in `next.config.ts`; `.env.example` |

**No auth** — public marketing site.

## React Compiler

`reactCompiler: true` — no manual `useMemo` / `useCallback` / `memo` for perf. See root `AGENTS.md` **React Compiler**; copy patterns from `apps/console` (`tasks.page.tsx`, `use-onboarding-gate.ts`) when adding client components.

## Avoid

- No `api/app` or app→app imports
- No Fumadocs / MDX pipeline
- No local Biome config unless intentionally splitting from root
- No shadcn from app-local paths — use `@repro-v2/ui`
- No inline `process.env` — extend `@repro-v2/env/marketing`
- No evlog `proxy.ts` / middleware (unlike console)
- No `useMemo` / `useCallback` / `memo` for perf — React Compiler enabled

## Deploy

- Railway: build `--filter marketing...`, healthcheck `/`

## Docs

- Env schema: `packages/env/src/marketing.ts`
- shadcn aliases: `components.json`
- Monorepo ports/scripts: root `README.md`
