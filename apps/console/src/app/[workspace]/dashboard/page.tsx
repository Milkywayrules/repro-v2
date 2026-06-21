'use client'

import { ClientOnly } from '@/components/client-only'
import { Loader } from '@/components/loader'
import { DashboardPageShell } from '@/modules/iam/dashboard-page-shell'

export default function WorkspaceDashboardPage() {
  return (
    <ClientOnly fallback={<Loader />}>
      <DashboardPageShell />
    </ClientOnly>
  )
}
