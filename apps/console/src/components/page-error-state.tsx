import type { ReactNode } from 'react'

import { cn } from '@repro-v2/ui/lib/utils'

import { InlineErrorCallout } from './inline-error-callout'

export function PageErrorState({
  title,
  message,
  actions,
  className,
  headingId,
  as: Component = 'div',
}: {
  title: string
  message: ReactNode
  actions?: ReactNode
  className?: string
  headingId?: string
  as?: 'div' | 'main'
}) {
  return (
    <Component
      aria-labelledby={
        headingId && Component === 'main' ? headingId : undefined
      }
      className={cn(
        'mx-auto mt-10 w-full max-w-md space-y-4 p-6 text-center',
        className,
      )}
    >
      <h1 className="font-bold text-3xl" id={headingId}>
        {title}
      </h1>
      <InlineErrorCallout>{message}</InlineErrorCallout>
      {actions ? <div className="flex flex-col gap-2">{actions}</div> : null}
    </Component>
  )
}
