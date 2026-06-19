import { env } from '@repro-v2/env/marketing'
import { Button } from '@repro-v2/ui/components/button'

import { ApiHealthBadge } from './api-health-badge'

export function HomePage() {
  return (
    <main className="flex min-h-svh flex-col items-center justify-center px-4">
      <div className="mx-auto max-w-2xl text-center">
        <div className="mb-4 flex justify-center">
          <ApiHealthBadge />
        </div>
        <h1 className="font-bold text-4xl tracking-tight sm:text-5xl">
          Build faster with repro-v2
        </h1>
        <p className="mt-4 text-lg text-muted-foreground">
          A modern TypeScript stack with Next.js, Elysia, and shared UI
          primitives.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
          <Button
            nativeButton={false}
            render={<a href={env.NEXT_PUBLIC_CONSOLE_URL}>Open Console</a>}
          />
          <Button
            nativeButton={false}
            render={<a href={env.NEXT_PUBLIC_DOCS_URL}>Read Docs</a>}
            variant="outline"
          />
        </div>
      </div>
    </main>
  )
}
