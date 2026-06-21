'use client'

import { ClientOnly } from '@/components/client-only'
import { Loader } from '@/components/loader'
import { DashboardPageShell } from '@/modules/iam/dashboard-page-shell'
import { FlatRouteGuard } from '@/modules/iam/flat-route-guard'

export default function DashboardPage() {
  return (
    <ClientOnly fallback={<Loader />}>
      <FlatRouteGuard subPath="dashboard">
        <DashboardPageShell />
      </FlatRouteGuard>
    </ClientOnly>
  )
}
