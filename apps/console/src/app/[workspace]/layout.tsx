'use client'

import { Suspense } from 'react'

import { ClientOnly } from '@/components/client-only'
import { Loader } from '@/components/loader'
import {
  useTrackLastWorkspaceSlug,
  useWorkspaceSlugParam,
} from '@/modules/iam/use-workspace-slug'

export default function WorkspaceLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <Suspense fallback={<Loader />}>
      <ClientOnly fallback={<Loader />}>
        <WorkspaceLayoutClient>{children}</WorkspaceLayoutClient>
      </ClientOnly>
    </Suspense>
  )
}

function WorkspaceLayoutClient({ children }: { children: React.ReactNode }) {
  const workspaceSlug = useWorkspaceSlugParam()
  useTrackLastWorkspaceSlug(workspaceSlug)

  return children
}
