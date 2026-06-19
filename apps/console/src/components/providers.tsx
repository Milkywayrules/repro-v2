'use client'

import { useRouter } from 'next/navigation'

import { isTreatyUnauthorized } from '@repro-v2/api-client'
import { AppProviders } from '@repro-v2/ui/providers/app-providers'

export default function Providers({ children }: { children: React.ReactNode }) {
  const router = useRouter()

  return (
    <AppProviders
      isUnauthorized={isTreatyUnauthorized}
      nuqs="next-app"
      onUnauthorized={() => {
        router.replace('/login')
      }}
    >
      {children}
    </AppProviders>
  )
}
