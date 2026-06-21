import type { ReactNode } from 'react'

import { Alert, AlertDescription } from '@repro-v2/ui/components/alert'
import { cn } from '@repro-v2/ui/lib/utils'

export function InlineErrorCallout({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <Alert
      className={cn(
        'rounded-md border-destructive/50 bg-destructive/10 text-destructive text-sm',
        className,
      )}
      variant="destructive"
    >
      <AlertDescription className="text-destructive text-sm">
        {children}
      </AlertDescription>
    </Alert>
  )
}
