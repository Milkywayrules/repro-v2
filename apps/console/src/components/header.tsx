'use client'

import Link from 'next/link'

import { routes, workspaceRoutes } from '@/lib/routes'
import { SessionChips } from '@/modules/iam/session-chips'
import { useEffectiveWorkspaceSlug } from '@/modules/iam/use-effective-workspace-slug'
import { useIamFeatures } from '@/modules/iam/use-iam-features'

import { ModeToggle } from './mode-toggle'
import { UserMenu } from './user-menu'

function headerLinks(workspaceEnabled: boolean, workspaceSlug: string | null) {
  if (workspaceEnabled && workspaceSlug) {
    return [
      { to: routes.home, label: 'Home' },
      { to: workspaceRoutes(workspaceSlug).dashboard, label: 'Dashboard' },
      { to: workspaceRoutes(workspaceSlug).tasks, label: 'Tasks' },
      { to: workspaceRoutes(workspaceSlug).settings, label: 'Settings' },
    ] as const
  }

  if (workspaceEnabled) {
    return [{ to: routes.home, label: 'Home' }] as const
  }

  return [
    { to: routes.home, label: 'Home' },
    { to: '/dashboard', label: 'Dashboard' },
    { to: '/tasks', label: 'Tasks' },
    { to: '/settings', label: 'Settings' },
  ] as const
}

export function Header() {
  const { features } = useIamFeatures()
  const workspaceEnabled = Boolean(features?.workspace)
  const workspaceSlug = useEffectiveWorkspaceSlug()
  const links = headerLinks(workspaceEnabled, workspaceSlug)

  return (
    <div>
      <div className="flex flex-row items-center justify-between px-2 py-1">
        <nav className="flex gap-4 text-lg">
          {links.map(({ to, label }) => (
            <Link href={to} key={to}>
              {label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <SessionChips />
          <ModeToggle />
          <UserMenu />
        </div>
      </div>
      <hr />
    </div>
  )
}
