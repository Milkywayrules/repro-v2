# apps/docs — agent instructions

Scoped rules for this app. Root `AGENTS.md` applies otherwise.

## Stack & port

- Next.js 16 App Router + **Fumadocs** (core, mdx, ui)
- Port **5009**; React 19, Tailwind 4, Fumadocs UI CSS (not `@repro-v2/ui/globals.css`)
- **Local Biome** (`biome.json`, `root: false`) — lint/format via `bun run lint` / `format` in this app, not root Ultracite
- `check-types` = `fumadocs-mdx && next typegen && tsc --noEmit`; `postinstall` runs `fumadocs-mdx`

## Layout

```
content/docs/           # MDX source — add pages here
source.config.ts        # Fumadocs collection config
proxy.ts                # markdown negotiation for /docs/* (app root, not src/)
src/
  app/
    (home)/             # landing → HomePage
    docs/[[...slug]]/   # doc pages
    api/search/         # Orama search
    og/docs/, llms*.txt, llms.mdx/docs/   # Fumadocs LLM/OG routes
  lib/source.ts         # loader + helpers
  lib/layout.shared.tsx # nav/github options
  lib/shared.ts         # appName, gitConfig, route constants
  modules/home/         # home.page.tsx, api-root-widget
  components/mdx.tsx    # MDX component map
```

Generated (gitignored): `.source/` — never hand-edit; regen via `fumadocs-mdx`.

## Use

| Concern        | Package / pattern                                                                                  |
| -------------- | -------------------------------------------------------------------------------------------------- |
| Docs content   | MDX in `content/docs/`; tree from `src/lib/source.ts`                                              |
| MDX components | `getMDXComponents()` in `src/components/mdx.tsx`                                                   |
| API widget     | `@repro-v2/api-client` + `rootQueryOptions` on home only                                           |
| Providers      | Fumadocs `RootProvider` wraps `@repro-v2/ui/providers/app-providers`                               |
| Env            | `@repro-v2/env/docs` — import in `next.config.ts`; extra flag `NEXT_PUBLIC_SHOW_INTERNAL_API_LINK` |
| Search         | `createFromSource(source)` at `/api/search`                                                        |

**Page convention:** thin `app/**/page.tsx` → `modules/<domain>/*.page.tsx`.

**No auth** — public docs site; don't add `@repro-v2/iam` without scope.

## Avoid

- No `api/app` or app→app imports
- No `@repro-v2/ui/globals.css` — use Fumadocs CSS in `src/app/global.css`
- No hand-editing `.source/`
- No skipping `fumadocs-mdx` in CI/build
- Don't copy console auth/protected-route patterns here

## Quirks

- `src/lib/shared.ts` still has Fumadocs template `gitConfig` / `appName` — update when branding
- `proxy.ts` has no `config.matcher` — Fumadocs negotiation handles `/docs/*`
- Only `@repro-v2/ui` for `AppProviders` — doc chrome is Fumadocs UI

## Docs

- App: `README.md`
- Authoring: `content/docs/`, `source.config.ts`
- External: https://fumadocs.dev
- Env schema: `packages/env/src/docs.ts`
