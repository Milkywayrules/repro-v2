'use client'

import type { Route } from 'next'

import type { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime'

import { writeLastWorkspaceSlug } from '@/lib/last-workspace-cookie'
import { routes, workspaceSubPathFromPathname } from '@/lib/routes'

import { pickDefaultWorkspaceSlug } from './list-workspaces'

export async function navigateAfterSessionSwitch(
  router: AppRouterInstance,
  pathname: string,
): Promise<void> {
  const slug = await pickDefaultWorkspaceSlug()

  if (!slug) {
    router.replace(routes.onboarding as Route)
    return
  }

  writeLastWorkspaceSlug(slug)
  const subPath = workspaceSubPathFromPathname(pathname)
  router.replace(`/${slug}/${subPath}` as Route)
}
