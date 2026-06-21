import Link from 'next/link'
import { useRouter } from 'next/navigation'

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
import { routes } from '@/lib/routes'
import { SessionSwitcher } from '@/modules/iam/session-switcher'
import { useIamFeatures } from '@/modules/iam/use-iam-features'
import { WORKSPACE_LIMIT } from '@/modules/iam/workspace-limit'
import { WorkspaceSwitcher } from '@/modules/iam/workspace-switcher'

export function UserMenu() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const mounted = useClientMounted()
  const { data: session, isPending } = iamClient.useSession()
  const { features } = useIamFeatures()
  const { data: organizations } = iamClient.useListOrganizations()

  const orgCount = organizations?.length ?? 0
  const canCreateWorkspace =
    features?.workspace && orgCount > 0 && orgCount < WORKSPACE_LIMIT

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
            <DropdownMenuItem render={<Link href={routes.onboarding} />}>
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
