'use client'

import { AppProviders } from '@repro-v2/ui/providers/app-providers'

export function Providers({ children }: { children: React.ReactNode }) {
  return <AppProviders>{children}</AppProviders>
}
