import { Suspense } from 'react'

import { ClientOnly } from '@/components/client-only'
import { FlatRouteGuard } from '@/modules/iam/flat-route-guard'
import { SettingsPage } from '@/modules/settings/settings.page'

export default function Page() {
  return (
    <Suspense fallback={<p className="p-4">Loading…</p>}>
      <ClientOnly fallback={<p className="p-4">Loading…</p>}>
        <FlatRouteGuard subPath="settings">
          <SettingsPage />
        </FlatRouteGuard>
      </ClientOnly>
    </Suspense>
  )
}
