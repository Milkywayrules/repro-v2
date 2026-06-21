# repro-v2

This project was created with [Better-T-Stack](https://github.com/AmanVarshney01/create-better-t-stack), a modern TypeScript stack that combines Next.js, Elysia, and more.

## Features

- **TypeScript** - For type safety and improved developer experience
- **Next.js** - Full-stack React framework
- **TailwindCSS** - Utility-first CSS for rapid UI development
- **Shared UI package** - shadcn/ui primitives live in `packages/ui`
- **Elysia** - Type-safe, high-performance framework
- **Bun** - Runtime environment
- **Drizzle** - TypeScript-first ORM
- **PostgreSQL** - Database engine
- **IAM** - Better Auth via `@repro-v2/iam` (feature flags from `IAM_*` env; public flags at `/api/v1/platform/iam-features`). Fork/setup notes: [docs/FORK-IAM.md](docs/FORK-IAM.md)
- **Biome** - Linting and formatting
- **Turborepo** - Optimized monorepo build system

## Getting Started

First, install the dependencies:

```bash
bun install
```

## Database Setup

This project uses PostgreSQL with Drizzle ORM.

1. Make sure you have a PostgreSQL database set up.
2. Update your `apps/api/.env` file with your PostgreSQL connection details.

3. Apply the schema to your database:

```bash
bun run db:push
```

Then, run the development server:

```bash
bun run dev
```

Open [http://localhost:5001](http://localhost:5001) in your browser to see the console application.
The API is running at [http://localhost:5000](http://localhost:5000).
The marketing site is at [http://localhost:5002](http://localhost:5002).
The docs site is at [http://localhost:5009](http://localhost:5009).

## UI Customization

React web apps in this stack share shadcn/ui primitives through `packages/ui`.

- Change design tokens and global styles in `packages/ui/src/styles/globals.css`
- Update shared primitives in `packages/ui/src/components/*`
- Adjust shadcn aliases or style config in `packages/ui/components.json` and `apps/console/components.json`

### Add more shared components

Run this from the project root to add more primitives to the shared UI package:

```bash
npx shadcn@latest add accordion dialog popover sheet table -c packages/ui
```

Import shared components like this:

```tsx
import { Button } from "@repro-v2/ui/components/button";
```

### Add app-specific blocks

If you want to add app-specific blocks instead of shared primitives, run the shadcn CLI from `apps/console`.

## Git Hooks and Formatting

- Run checks: `bun run check`

## Project Structure

```
repro-v2/
├── apps/
│   ├── api/           # Backend API (Elysia)
│   ├── browser-ext/   # Browser extension (WXT)
│   ├── console/       # Console application (Next.js)
│   ├── docs/          # Documentation site (Fumadocs)
│   └── marketing/     # Marketing landing page (Next.js)
├── packages/
│   ├── api-client/  # Eden Treaty client for the API
│   ├── api-schemas/ # Shared Zod request schemas
│   ├── api-types/   # API contract types and generated OpenAPI spec
│   ├── ui/          # Shared shadcn/ui components and styles
│   ├── iam/         # Better Auth server + React client
│   └── db/          # Database schema & queries
```

## Available Scripts

- `bun run dev`: Start all applications in development mode
- `bun run build`: Build all applications
- `bun run dev:console`: Start only the console application
- `bun run dev:api`: Start only the API
- `bun run dev:docs`: Start only the docs site
- `bun run dev:marketing`: Start only the marketing site
- `bun run check-types`: Check TypeScript types across all apps
- `bun run test`: Run API and package tests
- `bun run generate:openapi`: Regenerate the OpenAPI spec in `packages/api-types`
- `bun run db:push`: Push schema changes to database
- `bun run db:generate`: Generate database client/types
- `bun run db:migrate`: Run database migrations
- `bun run db:studio`: Open database studio UI
- `bun run check`: Run Biome formatting and linting
