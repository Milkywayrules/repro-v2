# apps/browser-ext — agent instructions

Scoped rules for this app. Root `AGENTS.md` applies otherwise.

## Stack & port

- **WXT** 0.20 + React 19 + `@wxt-dev/module-react`
- Targets: Chrome MV3 (`.output/chrome-mv3/`), Firefox MV2 (`.output/firefox-mv2/`)
- Dev port **5555**; every dev/build runs `wxt prepare` first (generates `.wxt/tsconfig.json`)
- No app tests — root `bun run smoke` builds both targets and checks manifests

## Layout

```
src/
  entrypoints/
    background.ts       # empty MV3 service worker stub
    popup/              # index.html, main.tsx, App.tsx, style.css
  modules/popup/        # popup.page.tsx + widgets (*.page.tsx)
  components/providers.tsx
  lib/                  # api-client, iam-client, console-login-url
```

Path alias: `@/` → `src/`. Entry: `App.tsx` → `PopupPage`.

**Scope today:** popup-only reference wiring — session gate, `/ready` dot, read-only task lists. No content scripts / options / side panel.

## Use

| Concern       | Package / pattern                                                                                                         |
| ------------- | ------------------------------------------------------------------------------------------------------------------------- |
| API           | `@repro-v2/api-client` — `createApiClient(env.WXT_API_URL)`, `credentials: 'include'`, `X-Requested-With: XMLHttpRequest` |
| Queries       | `@repro-v2/api-client/queries` — `readyQuery`, `taskListsQuery` (read-only)                                               |
| Auth          | `@repro-v2/iam/react` — `iamClient.useSession()`; login via **Console tab** (`WXT_CONSOLE_URL/login`)                   |
| Providers     | `@repro-v2/ui/providers/app-providers` — `showQueryDevtools={false}`                                                      |
| Env (runtime) | `@repro-v2/env/browser-ext` — `WXT_*` prefix, `import.meta.env`                                                           |
| Env (build)   | `wxt.config.ts` reads `WXT_API_URL` via dotenv for `host_permissions`                                                     |
| Styling       | Plain CSS in `popup/style.css` — not Tailwind/shadcn in popup                                                             |

**401:** `isTreatyUnauthorized` + `onUnauthorized` → `iamClient.signOut()`; widgets link to Console login.

**Manifest:** `host_permissions` = `${origin(WXT_API_URL)}/*`; Firefox gecko id `repro-v2@localhost`.

## Avoid

- No `api/app` or app→app imports
- No in-extension auth UI — link to Console
- No background logic until explicitly scoped (stub only)
- `WXT_DOCS_URL` / `WXT_MARKETING_URL` validated but unused in `src/` today
- Don't assume WXT `.output/**` is in Turbo build cache outputs

## Docs

- App: `README.md`
- WXT config: https://wxt.dev/api/config.html
- Skill reference: `.agents/skills/wxt-browser-extensions/`
- Env schema: `packages/env/src/browser-ext.ts`
- Auth extension origins: `packages/iam` (trusts `chrome-extension://*`, `moz-extension://*` in dev)
