'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

import { Button } from '@repro-v2/ui/components/button'
import { parseAsString, useQueryState } from 'nuqs'
import { toast } from 'sonner'

import { Loader } from '@/components/loader'
import { iamClient } from '@/lib/iam-client'
import { routes } from '@/lib/routes'
import { searchParams } from '@/lib/search-params'

export function AcceptInvitationPage() {
  const router = useRouter()
  const { data: session, isPending: sessionPending } = iamClient.useSession()
  const [invitationId] = useQueryState(searchParams.invitationId, parseAsString)
  const [isAccepting, setIsAccepting] = useState(false)

  useEffect(() => {
    if (sessionPending) {
      return
    }

    if (!session?.user) {
      const returnTo = invitationId
        ? `${routes.acceptInvitation}?id=${encodeURIComponent(invitationId)}`
        : routes.acceptInvitation
      router.replace(`${routes.login}?next=${encodeURIComponent(returnTo)}`)
    }
  }, [invitationId, router, session?.user, sessionPending])

  async function handleAccept() {
    if (!invitationId) {
      toast.error('Missing invitation id')
      return
    }

    setIsAccepting(true)

    const { error } = await iamClient.organization.acceptInvitation({
      invitationId,
    })

    setIsAccepting(false)

    if (error) {
      toast.error(error.message ?? 'Could not accept invitation')
      return
    }

    toast.success('Invitation accepted')
    router.push(routes.dashboard)
  }

  if (sessionPending || !session?.user) {
    return <Loader />
  }

  return (
    <main className="mx-auto mt-10 w-full max-w-md space-y-4 p-6 text-center">
      <h1 className="font-bold text-3xl">Workspace invitation</h1>
      {invitationId ? (
        <p className="text-muted-foreground text-sm">
          Accept this invitation to join the workspace.
        </p>
      ) : (
        <p className="text-destructive text-sm">
          This invitation link is invalid or incomplete.
        </p>
      )}
      <Button
        className="w-full"
        disabled={!invitationId || isAccepting}
        onClick={() => {
          handleAccept().catch(() => {
            setIsAccepting(false)
          })
        }}
      >
        {isAccepting ? 'Accepting…' : 'Accept invitation'}
      </Button>
    </main>
  )
}
