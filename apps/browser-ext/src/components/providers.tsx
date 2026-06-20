import type { ReactNode } from 'react'

import { isTreatyUnauthorized } from '@repro-v2/api-client'
import { AppProviders } from '@repro-v2/ui/providers/app-providers'

import { iamClient } from '@/lib/iam-client'

export function PopupProviders({ children }: { children: ReactNode }) {
  return (
    <AppProviders
      isUnauthorized={isTreatyUnauthorized}
      onUnauthorized={() => {
        iamClient.signOut().catch(() => {
          /* best-effort session clear after 401 */
        })
      }}
      showQueryDevtools={false}
    >
      {children}
    </AppProviders>
  )
}
