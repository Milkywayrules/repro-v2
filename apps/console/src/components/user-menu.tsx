import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'

import { WORKSPACE_LIMIT } from '@repro-v2/iam/workspace-limit'
import { Button } from '@repro-v2/ui/components/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@repro-v2/ui/components/dropdown-menu'
import { Skeleton } from '@repro-v2/ui/components/skeleton'
import { useQueryClient } from '@tanstack/react-query'

import { useClientMounted } from '@/hooks/use-client-mounted'
import { iamClient } from '@/lib/iam-client'
import { parseWorkspaceFromPathname, routes } from '@/lib/routes'
import { SessionSwitcher } from '@/modules/iam/session-switcher'
import { useIamFeatures } from '@/modules/iam/use-iam-features'
import { WorkspaceSwitcher } from '@/modules/iam/workspace-switcher'

function AuthenticatedUserMenu({
  session,
}: {
  session: NonNullable<ReturnType<typeof iamClient.useSession>['data']>
}) {
  const router = useRouter()
  const pathname = usePathname()
  const queryClient = useQueryClient()
  const { features } = useIamFeatures()
  const { data: organizations } = iamClient.useListOrganizations()

  const orgCount = organizations?.length ?? 0
  const canCreateWorkspace =
    features?.workspace && orgCount > 0 && orgCount < WORKSPACE_LIMIT
  const workspaceSlug = parseWorkspaceFromPathname(pathname)
  const onboardingHref =
    features?.workspace && workspaceSlug
      ? `${routes.onboarding}?next=${encodeURIComponent(pathname)}`
      : routes.onboarding

  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button variant="outline" />}>
        {session.user.name}
      </DropdownMenuTrigger>
      <DropdownMenuContent className="bg-card">
        <DropdownMenuGroup>
          <DropdownMenuLabel>My Account</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem>{session.user.email}</DropdownMenuItem>
          <WorkspaceSwitcher />
          {canCreateWorkspace ? (
            <DropdownMenuItem
              render={<Link href={onboardingHref as '/onboarding'} />}
            >
              Create workspace
            </DropdownMenuItem>
          ) : null}
          <SessionSwitcher />
          <DropdownMenuItem
            onClick={() => {
              iamClient.signOut({
                fetchOptions: {
                  onSuccess: () => {
                    queryClient.clear()
                    router.push('/')
                  },
                },
              })
            }}
            variant="destructive"
          >
            Sign Out
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export function UserMenu() {
  const mounted = useClientMounted()
  const { data: session, isPending } = iamClient.useSession()

  if (!mounted || isPending) {
    return <Skeleton className="h-9 w-24" />
  }

  if (!session) {
    return (
      <Link href="/login">
        <Button variant="outline">Sign In</Button>
      </Link>
    )
  }

  return <AuthenticatedUserMenu session={session} />
}
