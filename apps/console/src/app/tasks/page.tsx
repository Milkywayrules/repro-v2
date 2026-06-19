import { Suspense } from 'react'

import { TasksPage } from '@/modules/tasks/tasks.page'

export default function Page() {
  return (
    <Suspense fallback={<p className="p-4">Loading…</p>}>
      <TasksPage />
    </Suspense>
  )
}
