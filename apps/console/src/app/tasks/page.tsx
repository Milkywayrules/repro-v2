import { Suspense } from 'react'

import { TasksContent } from './tasks-content'

export default function TasksPage() {
  return (
    <Suspense fallback={<p className="p-4">Loading…</p>}>
      <TasksContent />
    </Suspense>
  )
}
