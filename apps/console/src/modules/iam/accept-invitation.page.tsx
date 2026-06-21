'use client'

import { useEffect, useState } from 'react'
import type { Route } from 'next'
import { useRouter } from 'next/navigation'

import { workspacePublicSlug } from '@repro-v2/iam/workspace-storage-slug'
import { Button } from '@repro-v2/ui/components/button'
import { parseAsString, useQueryState } from 'nuqs'
import { toast } from 'sonner'

import { InlineErrorCallout } from '@/components/inline-error-callout'
import { Loader } from '@/components/loader'
import { PageErrorState } from '@/components/page-error-state'
import { iamClient } from '@/lib/iam-client'
import { routes, workspaceRoutes } from '@/lib/routes'
import { searchParams } from '@/lib/search-params'

import { resolvePostAuthPath } from './auth-redirect'
import { resolveWorkspaceSlugById } from './list-workspaces'
import { useIamFeatures } from './use-iam-features'

interface InvitationDetails {
  email: string
  expiresAt: Date
  id: string
  inviterEmail: string
  organizationId: string
  organizationName: string
  organizationSlug?: string
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

function errorMessageIncludes(message: string, ...needles: string[]): boolean {
  const lowerMessage = message.toLowerCase()
  return needles.some(
    needle =>
      message.includes(needle) || lowerMessage.includes(needle.toLowerCase()),
  )
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
    organizationSlug:
      typeof data.organizationSlug === 'string'
        ? data.organizationSlug
        : undefined,
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
  if (errorMessageIncludes(message, 'ALREADY_A_MEMBER', 'already a member')) {
    return {
      status: 'already_member',
      invitation,
    }
  }

  if (errorMessageIncludes(message, 'NOT_THE_RECIPIENT')) {
    return {
      status: 'wrong_email',
      invitation,
    }
  }

  return null
}

async function resolveInvitationDestination(
  organizationId: string,
  organizationSlug: string | undefined,
  nextPath: string | null,
  features: ReturnType<typeof useIamFeatures>['features'],
): Promise<string> {
  if (nextPath) {
    return resolvePostAuthPath(nextPath, features)
  }

  if (!features?.workspace) {
    return '/dashboard'
  }

  const slugById = await resolveWorkspaceSlugById(organizationId)
  const slug =
    slugById ??
    (organizationSlug ? workspacePublicSlug(organizationSlug, undefined) : null)

  if (slug) {
    return workspaceRoutes(slug).dashboard
  }

  return resolvePostAuthPath(null, features)
}

export function AcceptInvitationPage() {
  const router = useRouter()
  const { features } = useIamFeatures()
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
        if (errorMessageIncludes(message, 'NOT_FOUND', 'not found')) {
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

  async function navigateAfterJoin(
    organizationId: string,
    organizationSlug?: string,
  ) {
    const destination = await resolveInvitationDestination(
      organizationId,
      organizationSlug,
      nextPath,
      features,
    )
    router.push(destination as Route)
  }

  async function handleAccept() {
    if (pageState.status !== 'ready' || !invitationId) {
      return
    }

    setIsAccepting(true)

    const { error } = await iamClient.organization.acceptInvitation({
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

    toast.success('Invitation accepted')
    await navigateAfterJoin(
      pageState.invitation.organizationId,
      pageState.invitation.organizationSlug,
    )
    setIsAccepting(false)
  }

  async function handleContinueToApp(
    organizationId: string,
    organizationSlug?: string,
  ) {
    setIsContinuing(true)
    try {
      await navigateAfterJoin(organizationId, organizationSlug)
    } finally {
      setIsContinuing(false)
    }
  }

  async function goToDefaultDashboard() {
    const destination = await resolvePostAuthPath(null, features)
    router.push(destination as Route)
  }

  function handleGoToDashboard() {
    goToDefaultDashboard().catch(() => undefined)
  }

  if (sessionPending || !session?.user || pageState.status === 'loading') {
    return <Loader />
  }

  if (pageState.status === 'missing_id') {
    return (
      <PageErrorState
        actions={
          <Button
            className="w-full"
            onClick={handleGoToDashboard}
            type="button"
            variant="outline"
          >
            Go to dashboard
          </Button>
        }
        as="main"
        headingId="invitation-heading"
        message="This invitation link is invalid or incomplete."
        title="Workspace invitation"
      />
    )
  }

  if (pageState.status === 'load_error') {
    return (
      <PageErrorState
        actions={
          <Button
            className="w-full"
            onClick={() => router.refresh()}
            type="button"
          >
            Try again
          </Button>
        }
        as="main"
        headingId="invitation-heading"
        message="Could not load invitation. Try again in a moment."
        title="Workspace invitation"
      />
    )
  }

  if (pageState.status === 'invalid') {
    return (
      <PageErrorState
        actions={
          <Button
            className="w-full"
            onClick={handleGoToDashboard}
            type="button"
            variant="outline"
          >
            Go to dashboard
          </Button>
        }
        as="main"
        headingId="invitation-heading"
        message={pageState.message}
        title="Workspace invitation"
      />
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
          onClick={handleGoToDashboard}
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
        <InlineErrorCallout>
          This invitation was sent to {pageState.invitation.email}. You are
          signed in as {session.user.email}.
        </InlineErrorCallout>
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
            handleContinueToApp(
              pageState.invitation.organizationId,
              pageState.invitation.organizationSlug,
            ).catch(() => {
              setIsContinuing(false)
              toast.error('Could not continue to app')
            })
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
