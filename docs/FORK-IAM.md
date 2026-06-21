# Fork IAM checklist

Concise reference for standing up or trimming Better Auth IAM in a fork of this monorepo.

## Feature flags (`IAM_*`)

All boolean; default `true` when omitted in `.env`.

| Flag | Effect when `false` |
| --- | --- |
| `IAM_EMAIL_PASSWORD_ENABLED` | No email/password sign-up or sign-in |
| `IAM_MAGIC_LINK_ENABLED` | No magic-link flow |
| `IAM_GITHUB_ENABLED` | No GitHub OAuth |
| `IAM_WORKSPACE_ENABLED` | No organizations/workspaces, onboarding, or invites |
| `IAM_MULTI_SESSION_ENABLED` | No multi-session switcher |
| `IAM_CAPTCHA_ENABLED` | No Turnstile on auth endpoints |

At least one of email/password, magic link, or GitHub must stay enabled.

Example minimal fork (password only, no workspaces):

```env
IAM_EMAIL_PASSWORD_ENABLED=true
IAM_MAGIC_LINK_ENABLED=false
IAM_GITHUB_ENABLED=false
IAM_WORKSPACE_ENABLED=false
IAM_MULTI_SESSION_ENABLED=false
IAM_CAPTCHA_ENABLED=false
```

## Required secrets per flag

| When enabled | Required env |
| --- | --- |
| Always | `IAM_BETTER_AUTH_SECRET` (≥32 chars), `IAM_BETTER_AUTH_URL`, `DATABASE_URL`, `CORS_ORIGIN` |
| `IAM_GITHUB_ENABLED` | `IAM_GITHUB_CLIENT_ID`, `IAM_GITHUB_CLIENT_SECRET` |
| `IAM_MAGIC_LINK_ENABLED` | `EMAIL_RESEND_API_KEY` |
| `IAM_CAPTCHA_ENABLED` + `TURNSTILE_ENABLED` | `TURNSTILE_SECRET_KEY`; console needs `NEXT_PUBLIC_TURNSTILE_SITE_KEY` |
| `IAM_WORKSPACE_ENABLED` | Resend key if you send invite emails (`EMAIL_RESEND_API_KEY`) |

## Apps to keep or remove

| App | Keep if… |
| --- | --- |
| `apps/api` | Always — hosts Better Auth at `/api/auth/*` and IAM feature flags |
| `apps/console` | You need the signed-in product UI |
| `apps/marketing` | Public landing / sign-up links |
| `apps/docs` | Product docs |
| `apps/browser-ext` | Extension; uses same IAM client + CORS |

Remove unused apps from `turbo.json` / CI and drop their origins from `CORS_ORIGIN`.

## URLs and origins

- **`IAM_BETTER_AUTH_URL`** — public API base used by Better Auth (e.g. `http://localhost:5000` dev, `https://api.example.com` prod).
- **`CORS_ORIGIN`** — comma-separated console, marketing, docs origins allowed to call the API with credentials.
- **`EXTENSION_TRUSTED_ORIGINS`** — production MV3 extension origins (`chrome-extension://…`); dev allows `chrome-extension://*` and `moz-extension://*` automatically.
- Console/marketing set **`NEXT_PUBLIC_API_URL`** to the same host as `IAM_BETTER_AUTH_URL`.

## GitHub OAuth callback

Register in GitHub OAuth app:

```text
{IAM_BETTER_AUTH_URL}/api/auth/callback/github
```

Example dev: `http://localhost:5000/api/auth/callback/github`

## Database

- **Local / early fork:** `bun run db:push` applies Drizzle schema (see root README).
- **Production hardening:** switch to migrations (`db:generate` + `db:migrate`) before shipping; Railway preDeploy currently uses `db:push` by design until migrations are finalized.

Auth tables live in `@repro-v2/db` under `schema/auth` (workspace model name maps Better Auth “organization” to `workspace`).

## Onboarding behavior

When `IAM_WORKSPACE_ENABLED=true`, new users are **not** auto-provisioned a workspace. Flow: sign up/in → `/onboarding` if no org → user creates workspace → app. Development-only demo tasks seed on **first workspace create**, not on sign-up.

## Public feature discovery

Frontends read flags from `GET /api/v1/platform/iam-features` via `@repro-v2/api-client/queries` (`iamFeaturesQueryOptions`).
