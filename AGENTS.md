# Personal behavior & Coding principles (MUST FOLLOW)

- the goal is to make production-level industry-standard batle-proven apps for a busy traffic product.
- dont overengineering.
- YAGNI, DRY, KISS.
- composition over inheritance.
- cohesion over coupling.
- Boy Scout Rule. dont leave any unimportant stubs, traces, and leftovers that can be a tech debt in the future.
- agent-first code.
- focus on make the code working -> optimize for security, performance, size, maintainability, quality -> simplify code.
- prevent code smells.
- be responsible, be professional, be curious, dont prefer assumptions, dont overstepped — proceed when requirements and docs are clear.
- fuck off if you `do too much → realize it → long apology`.
- you are allowed to contradict. dont always agree with me.
- when there are questions that not yet answered by me, confirm again, maybe i forgot.
- on **critical or ambiguous** items (e.g. scope, deletes, auth, merge targets, product intent, refactors): MUST **ask or confirm using question picker with me first** — do not guess.
- **chat proposals are not implementation approval** — answer first; code only when requirements are clear or I explicitly say go.
- **one question batch at a time with the picker**; use a structured format: single pick, multi pick, or short essay — not a wall of mixed questions. Dependant question should be on a different question batch.
- if docs conflict or stakes are high, stop and ask before implementing.

---

# Agent doc map

| Need                             | Open                                                                                                                                                                                                                                                   |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| App-scoped rules                 | [apps/api/AGENTS.md](apps/api/AGENTS.md), [apps/console/AGENTS.md](apps/console/AGENTS.md), [apps/browser-ext/AGENTS.md](apps/browser-ext/AGENTS.md), [apps/docs/AGENTS.md](apps/docs/AGENTS.md), [apps/marketing/AGENTS.md](apps/marketing/AGENTS.md) |
| Git commits (style + no trailer) | [.cursor/rules/verasic-git-commits.mdc](.cursor/rules/verasic-git-commits.mdc)                                                                                                                                                                         |
| JSDoc / code comments            | [.cursor/rules/verasic-jsdoc-and-comments.mdc](.cursor/rules/verasic-jsdoc-and-comments.mdc)                                                                                                                                                           |
| Human onboarding                 | [README.md](README.md)                                                                                                                                                                                                                                 |
| shadcn MCP                       | [.agents/skills/shadcn/mcp.md](.agents/skills/shadcn/mcp.md)                                                                                                                                                                                           |
| Better Auth                      | [.agents/skills/better-auth-best-practices/SKILL.md](.agents/skills/better-auth-best-practices/SKILL.md)                                                                                                                                               |
| Drizzle                          | [.agents/skills/drizzle-orm-patterns/SKILL.md](.agents/skills/drizzle-orm-patterns/SKILL.md)                                                                                                                                                           |
| Log debugging                    | [.agents/skills/analyze-logs/SKILL.md](.agents/skills/analyze-logs/SKILL.md)                                                                                                                                                                           |

Skills under `.agents/skills/` are reference — load when the task matches.

---

# Ultracite Code Standards

This project uses **Ultracite**, a zero-config preset that enforces strict code quality standards through automated formatting and linting.

## Quick Reference

- **Format code**: `bun x ultracite fix`
- **Check for issues**: `bun x ultracite check`
- **Diagnose setup**: `bun x ultracite doctor`

Biome (the underlying engine) provides robust linting and formatting. Most issues are automatically fixable.

---

## Core Principles

Write code that is **accessible, performant, type-safe, and maintainable**. Focus on clarity and explicit intent over brevity.

### Type Safety & Explicitness

- Use explicit types for function parameters and return values when they enhance clarity
- Prefer `unknown` over `any` when the type is genuinely unknown
- Use const assertions (`as const`) for immutable values and literal types
- Leverage TypeScript's type narrowing instead of type assertions
- Use meaningful variable names instead of magic numbers - extract constants with descriptive names

### Modern JavaScript/TypeScript

- Use arrow functions for callbacks and short functions
- Prefer `for...of` loops over `.forEach()` and indexed `for` loops
- Use optional chaining (`?.`) and nullish coalescing (`??`) for safer property access
- Prefer template literals over string concatenation
- Use destructuring for object and array assignments
- Use `const` by default, `let` only when reassignment is needed, never `var`

### Async & Promises

- Always `await` promises in async functions - don't forget to use the return value
- Use `async/await` syntax instead of promise chains for better readability
- Handle errors appropriately in async code with try-catch blocks
- Don't use async functions as Promise executors

### React & JSX

- Use function components over class components
- Call hooks at the top level only, never conditionally
- Specify all dependencies in hook dependency arrays correctly
- Use the `key` prop for elements in iterables (prefer unique IDs over array indices)
- Nest children between opening and closing tags instead of passing as props
- Don't define components inside other components
- Use semantic HTML and ARIA attributes for accessibility:
  - Provide meaningful alt text for images
  - Use proper heading hierarchy
  - Add labels for form inputs
  - Include keyboard event handlers alongside mouse events
  - Use semantic elements (`<button>`, `<nav>`, etc.) instead of divs with roles

### Error Handling & Debugging

- Remove `console.log`, `debugger`, and `alert` statements from production code
- Throw `Error` objects with descriptive messages, not strings or other values
- Use `try-catch` blocks meaningfully - don't catch errors just to rethrow them
- Prefer early returns over nested conditionals for error cases

### Code Organization

- Keep functions focused and under reasonable cognitive complexity limits
- Extract complex conditions into well-named boolean variables
- Use early returns to reduce nesting
- Prefer simple conditionals over nested ternary operators
- Group related code together and separate concerns

### Security

- Add `rel="noopener"` when using `target="_blank"` on links
- Avoid `dangerouslySetInnerHTML` unless absolutely necessary
- Don't use `eval()` or assign directly to `document.cookie`
- Validate and sanitize user input

### Performance

- Avoid spread syntax in accumulators within loops
- Use top-level regex literals instead of creating them in loops
- Prefer specific imports over namespace imports
- Avoid barrel files (index files that re-export everything)
- Use proper image components (e.g., Next.js `<Image>`) over `<img>` tags

### Framework-Specific Guidance

**Next.js:**

- Use Next.js `<Image>` component for images
- Use `next/head` or App Router metadata API for head elements
- Use Server Components for async data fetching instead of async Client Components

**React 19+:**

- Use ref as a prop instead of `React.forwardRef`

**Solid/Svelte/Vue/Qwik:**

- Use `class` and `for` attributes (not `className` or `htmlFor`)

## Validation — Zod repo-wide

Use **Zod** for env, request bodies, query params, and form validation across the monorepo.

- **Do** use Zod for env, request bodies, query params, forms.
- **Do** use Elysia + Zod via Standard Schema when route validation is needed.
- **Do not** use Elysia TypeBox in app or package code.
- **Do** use `zod` schemas and `safeParse` / `parse` patterns (see `@repro/env`, console auth forms).
- **Do** use Elysia with Zod via Standard Schema (e.g. `zodToStandardSchema` / `@standard-schema/zod`) when route validation is needed.
- **Do not** use Elysia TypeBox (`Elysia.t`, `@sinclair/typebox`) in app or package code.
- **Do not** add TypeBox-based validation because `.agents/skills/elysiajs/` examples use it — those are reference only.

---

## Testing

- Write assertions inside `it()` or `test()` blocks
- Avoid done callbacks in async tests - use async/await instead
- Don't use `.only` or `.skip` in committed code
- Keep test suites reasonably flat - avoid excessive `describe` nesting

## When Biome Can't Help

Biome's linter will catch most issues automatically. Focus your attention on:

1. **Business logic correctness** - Biome can't validate your algorithms
2. **Meaningful naming** - Use descriptive names for functions, variables, and types
3. **Architecture decisions** - Component structure, data flow, and API design
4. **Edge cases** - Handle boundary conditions and error states
5. **User experience** - Accessibility, performance, and usability considerations
6. **Documentation** - Add comments for complex logic, but prefer self-documenting code

---

Most formatting and common issues are automatically fixed by Biome. Run `bun x ultracite fix` before committing to ensure compliance.

---

## App boundary (monorepo)

| Package / app           | Owns                                                                           |
| ----------------------- | ------------------------------------------------------------------------------ |
| `@repro-v2/api-schemas` | Zod request/input schemas                                                      |
| `@repro-v2/api-types`   | Contract types, HTTP constants, generated OpenAPI JSON                         |
| `@repro-v2/api-client`  | Eden Treaty client, route response types, TanStack Query helpers (`./queries`) |
| `apps/api`              | Server implementation (`createApp`, modules, services)                         |

- **`apps/api/src/app.ts` exports `type App`** — the only cross-app type surface from the API app.
- **`@repro-v2/api-client`** is the sole package that may `import type { App } from 'api/app'`.
- **No app→app imports**; frontends use `@repro-v2/api-client`, `@repro-v2/iam/react`, and `@repro-v2/api-types/contract`.
- **No tsconfig path cheats** to sibling app source (e.g. console must not map `@/*` to `../api/src/*`).
- Zod request schemas live in `@repro-v2/api-schemas`; OpenAPI spec drift-check via `bun run generate:openapi`.
- **`apps/api` emits `dist-types/`** via `prepare` and `check-types` (`tsc -b`) before dependents such as `@repro-v2/api-client` typecheck. Turbo `^check-types` enforces build order on `bun run check-types`.
- **Page convention:** domain UI lives in `modules/<domain>/*.page.tsx` exporting a `*Page` component; `app/**/page.tsx` stays a thin route shell (Suspense, metadata).
