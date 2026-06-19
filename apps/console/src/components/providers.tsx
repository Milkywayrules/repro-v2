'use client'

import { useRouter } from 'next/navigation'

import { AppProviders } from '@repro-v2/ui/providers/app-providers'

export default function Providers({ children }: { children: React.ReactNode }) {
  const router = useRouter()

  return (
    <AppProviders
      nuqs="next-app"
      onUnauthorized={() => {
        router.replace('/login')
      }}
    >
      {children}
    </AppProviders>
  )
}
