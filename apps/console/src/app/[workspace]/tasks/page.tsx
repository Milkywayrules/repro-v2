import { Suspense } from 'react'

import { ClientOnly } from '@/components/client-only'
import { TasksPage } from '@/modules/tasks/tasks.page'

export default function Page() {
  return (
    <Suspense fallback={<p className="p-4">Loading…</p>}>
      <ClientOnly fallback={<p className="p-4">Loading…</p>}>
        <TasksPage />
      </ClientOnly>
    </Suspense>
  )
}
