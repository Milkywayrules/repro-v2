'use client'

import { useEffect, useState } from 'react'
import type { Route } from 'next'
import { useRouter } from 'next/navigation'

import { activeWorkspaceId } from '@repro-v2/iam/session'
import { Button } from '@repro-v2/ui/components/button'
import { parseAsString, useQueryState } from 'nuqs'
import { toast } from 'sonner'

import { Loader } from '@/components/loader'
import { iamClient } from '@/lib/iam-client'
import { routes } from '@/lib/routes'
import { searchParams } from '@/lib/search-params'

import { resolvePostAuthPath } from './auth-redirect'

interface InvitationDetails {
  email: string
  expiresAt: Date
  id: string
  inviterEmail: string
  organizationId: string
  organizationName: string
  status: string
}

type PageState =
  | { status: 'missing_id' }
  | { status: 'loading' }
  | { status: 'ready'; invitation: InvitationDetails }
  | { status: 'expired'; invitation: InvitationDetails }
  | { status: 'invalid'; message: string }
  | { status: 'wrong_email'; invitation: InvitationDetails }
  | { status: 'already_member'; invitation: InvitationDetails }
  | { status: 'load_error' }

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase()
}

function parseExpiresAt(value: unknown): Date | null {
  if (value instanceof Date) {
    return value
  }

  if (typeof value === 'string' || typeof value === 'number') {
    const parsed = new Date(value)
    return Number.isNaN(parsed.getTime()) ? null : parsed
  }

  return null
}

function parseInvitation(
  data: Record<string, unknown>,
): InvitationDetails | null {
  if (
    typeof data.id !== 'string' ||
    typeof data.email !== 'string' ||
    typeof data.status !== 'string' ||
    typeof data.organizationId !== 'string' ||
    typeof data.organizationName !== 'string' ||
    typeof data.inviterEmail !== 'string'
  ) {
    return null
  }

  const expiresAt = parseExpiresAt(data.expiresAt)

  if (!expiresAt) {
    return null
  }

  return {
    id: data.id,
    email: data.email,
    status: data.status,
    organizationId: data.organizationId,
    organizationName: data.organizationName,
    inviterEmail: data.inviterEmail,
    expiresAt,
  }
}

function InvitationSummary({ invitation }: { invitation: InvitationDetails }) {
  return (
    <dl className="space-y-3 rounded-lg border bg-muted/30 p-4 text-left text-sm">
      <div>
        <dt className="text-muted-foreground">Workspace</dt>
        <dd className="font-medium">{invitation.organizationName}</dd>
      </div>
      <div>
        <dt className="text-muted-foreground">Invited by</dt>
        <dd>{invitation.inviterEmail}</dd>
      </div>
      <div>
        <dt className="text-muted-foreground">Invited email</dt>
        <dd>{invitation.email}</dd>
      </div>
    </dl>
  )
}

function buildAcceptInvitationReturnTo(
  invitationId: string,
  nextPath: string | null,
): string {
  const params = new URLSearchParams({
    [searchParams.invitationId]: invitationId,
  })

  if (nextPath) {
    params.set(searchParams.next, nextPath)
  }

  return `${routes.acceptInvitation}?${params.toString()}`
}

function resolvePageState(
  invitation: InvitationDetails,
  sessionEmail: string,
): PageState {
  if (normalizeEmail(invitation.email) !== normalizeEmail(sessionEmail)) {
    return {
      status: 'wrong_email',
      invitation,
    }
  }

  if (invitation.status === 'accepted') {
    return {
      status: 'already_member',
      invitation,
    }
  }

  if (invitation.status !== 'pending') {
    return {
      status: 'invalid',
      message: 'This invitation is no longer valid.',
    }
  }

  if (invitation.expiresAt.getTime() < Date.now()) {
    return {
      status: 'expired',
      invitation,
    }
  }

  return {
    status: 'ready',
    invitation,
  }
}

function resolveAcceptErrorState(
  message: string,
  invitation: InvitationDetails,
): PageState | null {
  if (
    message.includes('ALREADY_A_MEMBER') ||
    message.toLowerCase().includes('already a member')
  ) {
    return {
      status: 'already_member',
      invitation,
    }
  }

  if (
    message.includes('NOT_THE_RECIPIENT') ||
    message.toLowerCase().includes('recipient')
  ) {
    return {
      status: 'wrong_email',
      invitation,
    }
  }

  return null
}

function organizationIdFromAcceptResponse(
  data: unknown,
  fallbackOrganizationId: string,
): string {
  if (
    data &&
    typeof data === 'object' &&
    'invitation' in data &&
    data.invitation &&
    typeof data.invitation === 'object' &&
    'organizationId' in data.invitation &&
    typeof data.invitation.organizationId === 'string'
  ) {
    return data.invitation.organizationId
  }

  return fallbackOrganizationId
}

async function setActiveOrganizationIfNeeded(
  session: unknown,
  organizationId: string,
): Promise<boolean> {
  if (activeWorkspaceId(session) === organizationId) {
    return true
  }

  const { error: setActiveError } = await iamClient.organization.setActive({
    organizationId,
  })

  return !setActiveError
}

export function AcceptInvitationPage() {
  const router = useRouter()
  const { data: session, isPending: sessionPending } = iamClient.useSession()
  const [invitationId] = useQueryState(searchParams.invitationId, parseAsString)
  const [nextPath] = useQueryState(searchParams.next, parseAsString)
  const [pageState, setPageState] = useState<PageState>({ status: 'loading' })
  const [isAccepting, setIsAccepting] = useState(false)
  const [isContinuing, setIsContinuing] = useState(false)

  useEffect(() => {
    if (sessionPending) {
      return
    }

    if (!session?.user) {
      const returnTo = invitationId
        ? buildAcceptInvitationReturnTo(invitationId, nextPath)
        : routes.acceptInvitation
      router.replace(
        `${routes.login}?${searchParams.next}=${encodeURIComponent(returnTo)}`,
      )
    }
  }, [invitationId, nextPath, router, session?.user, sessionPending])

  useEffect(() => {
    if (!invitationId) {
      setPageState({ status: 'missing_id' })
      return
    }

    if (sessionPending || !session?.user) {
      setPageState({ status: 'loading' })
      return
    }

    const sessionEmail = session.user.email
    let cancelled = false
    setPageState({ status: 'loading' })

    async function loadInvitation() {
      const { data, error } = await iamClient.organization.getInvitation({
        query: { id: invitationId ?? '' },
      })

      if (cancelled) {
        return
      }

      if (error || !data) {
        const message = error?.message ?? 'Could not load invitation'
        if (
          message.includes('NOT_FOUND') ||
          message.toLowerCase().includes('not found')
        ) {
          setPageState({
            status: 'invalid',
            message: 'This invitation link is invalid or has expired.',
          })
          return
        }

        setPageState({ status: 'load_error' })
        return
      }

      const invitation = parseInvitation(data as Record<string, unknown>)
      if (!invitation) {
        setPageState({
          status: 'invalid',
          message: 'This invitation could not be read.',
        })
        return
      }

      setPageState(resolvePageState(invitation, sessionEmail))
    }

    loadInvitation().catch(() => {
      if (!cancelled) {
        setPageState({ status: 'load_error' })
      }
    })

    return () => {
      cancelled = true
    }
  }, [invitationId, session?.user, sessionPending])

  async function handleAccept() {
    if (pageState.status !== 'ready' || !invitationId) {
      return
    }

    setIsAccepting(true)

    const { data, error } = await iamClient.organization.acceptInvitation({
      invitationId,
    })

    if (error) {
      setIsAccepting(false)
      const message = error.message ?? 'Could not accept invitation'
      const nextState = resolveAcceptErrorState(message, pageState.invitation)

      if (nextState) {
        setPageState(nextState)
        return
      }

      toast.error(message)
      return
    }

    const organizationId = organizationIdFromAcceptResponse(
      data,
      pageState.invitation.organizationId,
    )

    const activated = await setActiveOrganizationIfNeeded(
      session?.session,
      organizationId,
    )

    if (!activated) {
      setIsAccepting(false)
      toast.error('Could not switch to workspace')
      return
    }

    toast.success('Invitation accepted')
    router.push(resolvePostAuthPath(nextPath) as Route)
  }

  async function handleContinueToApp(organizationId: string) {
    setIsContinuing(true)

    const activated = await setActiveOrganizationIfNeeded(
      session?.session,
      organizationId,
    )

    if (!activated) {
      setIsContinuing(false)
      toast.error('Could not switch to workspace')
      return
    }

    router.push(resolvePostAuthPath(nextPath) as Route)
  }

  if (sessionPending || !session?.user || pageState.status === 'loading') {
    return <Loader />
  }

  if (pageState.status === 'missing_id') {
    return (
      <main
        aria-labelledby="invitation-heading"
        className="mx-auto mt-10 w-full max-w-md space-y-4 p-6 text-center"
      >
        <h1 className="font-bold text-3xl" id="invitation-heading">
          Workspace invitation
        </h1>
        <p className="text-destructive text-sm" role="alert">
          This invitation link is invalid or incomplete.
        </p>
        <Button
          className="w-full"
          onClick={() => router.push(routes.dashboard)}
          type="button"
          variant="outline"
        >
          Go to dashboard
        </Button>
      </main>
    )
  }

  if (pageState.status === 'load_error') {
    return (
      <main
        aria-labelledby="invitation-heading"
        className="mx-auto mt-10 w-full max-w-md space-y-4 p-6 text-center"
      >
        <h1 className="font-bold text-3xl" id="invitation-heading">
          Workspace invitation
        </h1>
        <p className="text-destructive text-sm" role="alert">
          Could not load invitation. Try again in a moment.
        </p>
        <Button
          className="w-full"
          onClick={() => router.refresh()}
          type="button"
        >
          Try again
        </Button>
      </main>
    )
  }

  if (pageState.status === 'invalid') {
    return (
      <main
        aria-labelledby="invitation-heading"
        className="mx-auto mt-10 w-full max-w-md space-y-4 p-6 text-center"
      >
        <h1 className="font-bold text-3xl" id="invitation-heading">
          Workspace invitation
        </h1>
        <p className="text-destructive text-sm" role="alert">
          {pageState.message}
        </p>
        <Button
          className="w-full"
          onClick={() => router.push(routes.dashboard)}
          type="button"
          variant="outline"
        >
          Go to dashboard
        </Button>
      </main>
    )
  }

  if (pageState.status === 'expired') {
    return (
      <main
        aria-labelledby="invitation-heading"
        className="mx-auto mt-10 w-full max-w-md space-y-4 p-6 text-center"
      >
        <h1 className="font-bold text-3xl" id="invitation-heading">
          Invitation expired
        </h1>
        <p className="text-muted-foreground text-sm">
          Ask {pageState.invitation.inviterEmail} to send a new invitation to{' '}
          {pageState.invitation.organizationName}.
        </p>
        <InvitationSummary invitation={pageState.invitation} />
        <Button
          className="w-full"
          onClick={() => router.push(routes.dashboard)}
          type="button"
          variant="outline"
        >
          Go to dashboard
        </Button>
      </main>
    )
  }

  if (pageState.status === 'wrong_email') {
    return (
      <main
        aria-labelledby="invitation-heading"
        className="mx-auto mt-10 w-full max-w-md space-y-4 p-6 text-center"
      >
        <h1 className="font-bold text-3xl" id="invitation-heading">
          Wrong account
        </h1>
        <p className="text-destructive text-sm" role="alert">
          This invitation was sent to {pageState.invitation.email}. You are
          signed in as {session.user.email}.
        </p>
        <InvitationSummary invitation={pageState.invitation} />
        <Button
          className="w-full"
          onClick={() => {
            iamClient.signOut({
              fetchOptions: {
                onSuccess: () => {
                  const returnTo = buildAcceptInvitationReturnTo(
                    pageState.invitation.id,
                    nextPath,
                  )
                  router.push(
                    `${routes.login}?${searchParams.next}=${encodeURIComponent(returnTo)}`,
                  )
                },
              },
            })
          }}
          type="button"
          variant="outline"
        >
          Sign out and use invited email
        </Button>
      </main>
    )
  }

  if (pageState.status === 'already_member') {
    return (
      <main
        aria-labelledby="invitation-heading"
        className="mx-auto mt-10 w-full max-w-md space-y-4 p-6 text-center"
      >
        <h1 className="font-bold text-3xl" id="invitation-heading">
          Already a member
        </h1>
        <p className="text-muted-foreground text-sm">
          You already have access to {pageState.invitation.organizationName}.
        </p>
        <InvitationSummary invitation={pageState.invitation} />
        <Button
          aria-busy={isContinuing}
          className="w-full"
          disabled={isContinuing}
          onClick={() => {
            handleContinueToApp(pageState.invitation.organizationId).catch(
              () => {
                setIsContinuing(false)
                toast.error('Could not continue to app')
              },
            )
          }}
          type="button"
        >
          {isContinuing ? 'Continuing…' : 'Continue to app'}
        </Button>
      </main>
    )
  }

  return (
    <main
      aria-labelledby="invitation-heading"
      className="mx-auto mt-10 w-full max-w-md space-y-6 p-6 text-center"
    >
      <div className="space-y-2">
        <h1 className="font-bold text-3xl" id="invitation-heading">
          Join workspace
        </h1>
        <p className="text-muted-foreground text-sm">
          Accept this invitation to collaborate in{' '}
          {pageState.invitation.organizationName}.
        </p>
      </div>

      <InvitationSummary invitation={pageState.invitation} />

      <Button
        aria-busy={isAccepting}
        className="w-full"
        disabled={isAccepting}
        onClick={() => {
          handleAccept().catch(() => {
            setIsAccepting(false)
            toast.error('Could not accept invitation')
          })
        }}
        type="button"
      >
        {isAccepting ? 'Accepting…' : 'Accept invitation'}
      </Button>
    </main>
  )
}
