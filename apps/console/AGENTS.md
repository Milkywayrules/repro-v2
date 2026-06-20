# apps/console — agent instructions

Scoped rules for this app. Root `AGENTS.md` applies otherwise.

## Stack & port

- Next.js 16 App Router, React 19, `reactCompiler: true`, Tailwind v4
- Port **5001** (`dev`, `start:local`)
- Bun: `bun test src`, `check-types` = `next typegen && tsc --noEmit`

## Layout

```
src/
  app/**/page.tsx       # thin shells — Suspense, metadata, ClientOnly
  modules/<domain>/*.page.tsx   # domain UI (*Page export)
  components/           # app-local (forms, header, providers)
  lib/                  # api-client, iam-client, routes, evlog, nuqs parsers
  hooks/
  app/api/              # /api/health, /api/ready (Railway probes)
  proxy.ts              # evlog middleware for /api/:path* (not middleware.ts)
```

Path aliases: `@/*` → `src/*`; `@repro-v2/ui/*` → `packages/ui/src/*`.

## Use

| Concern   | Package / pattern                                                                                            |
| --------- | ------------------------------------------------------------------------------------------------------------ |
| API       | `@repro-v2/api-client` — `createApiClient(env.NEXT_PUBLIC_API_URL)`, `credentials: 'include'`                |
| Queries   | `@repro-v2/api-client/queries` + TanStack Query via `@repro-v2/ui/providers/app-providers`                   |
| Auth      | `@repro-v2/iam/react` — `createIamReactClient`; client session guards (`useSession`, redirect to `/login`) |
| Forms     | TanStack Form + Zod (sign-in/up)                                                                             |
| URL state | `nuqs` (`useQueryState`, Zod-backed parsers)                                                                 |
| Env       | `@repro-v2/env/console` — import in `next.config.ts`; template `.env.example`                                |
| UI        | `@repro-v2/ui` + shadcn `components.json` (style `base-lyra`)                                                |
| Logging   | `evlog` — `instrumentation.ts`, `src/lib/evlog.ts`, `src/proxy.ts`                                           |
| Styling   | `@repro-v2/ui/globals.css` in app CSS                                                                        |

**Page convention:** `app/**/page.tsx` delegates to `modules/<domain>/*.page.tsx`. Most feature pages are `'use client'`.

**Hydration:** `ClientOnly` + `useClientMounted` (`useSyncExternalStore`) for auth/menu.

**401:** `AppProviders` + `isTreatyUnauthorized` → `router.replace('/login')`.

## Avoid

- No `import type { App } from 'api/app'` or any `apps/api/src/*` import
- No `@repro-v2/api-schemas` / `@repro-v2/api-types` in UI — use `@repro-v2/api-client`
- No server-side auth middleware today — don't add without explicit scope
- No RSC data fetching for API — client Query + Treaty
- No tsconfig path cheats to sibling apps

## Tests & deploy

- Probe tests: `src/app/api/health/route.test.ts`, `ready/route.test.ts` (ready fails CI if API down)
- `bunfig.toml` preloads `test-preload.ts` for env
- Railway: build `--filter console...`, healthcheck **`/api/ready`**

## Docs

- Env schema: `packages/env/src/console.ts`
- IAM client example: `src/lib/iam-client.ts` (see `packages/iam/README.md`)
- Monorepo: root `README.md`, root `AGENTS.md` (app boundary)
