'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

import { env } from '@repro-v2/env/console'
import { Button } from '@repro-v2/ui/components/button'
import { Skeleton } from '@repro-v2/ui/components/skeleton'
import { useQueryClient } from '@tanstack/react-query'

import Loader from '@/components/loader'
import { iamClient } from '@/lib/iam-client'
import { routes } from '@/lib/routes'

import { EmailSignInForm, EmailSignUpForm } from './email-auth-forms'
import { GitHubOAuthButton } from './github-oauth-button'
import { MagicLinkForm } from './magic-link-form'
import { TurnstileWidget } from './turnstile-widget'
import type { PublicIamFeatures } from './types'
import { useIamFeatures } from './use-iam-features'
import {
  type PostAuthRedirectResult,
  usePostAuthRedirect,
} from './use-post-auth-redirect'

function hasAnyAuthMethod(features: PublicIamFeatures | undefined): boolean {
  return Boolean(
    features &&
      (features.emailPassword || features.magicLink || features.github),
  )
}

type RedirectState =
  | { status: 'pending' }
  | { status: 'error'; message: string }

function finishRedirect(
  setRedirectState: (state: RedirectState) => void,
  result: PostAuthRedirectResult,
) {
  if (!result.ok) {
    setRedirectState({ status: 'error', message: result.error })
  }
}

function failRedirect(setRedirectState: (state: RedirectState) => void) {
  setRedirectState({
    status: 'error',
    message: 'Could not continue',
  })
}

function LoginRedirectError({
  message,
  onRetry,
  onSignOut,
}: {
  message: string
  onRetry: () => void
  onSignOut: () => void
}) {
  return (
    <div className="mx-auto mt-10 w-full max-w-md space-y-4 p-6 text-center">
      <h1 className="font-bold text-3xl">Could not continue</h1>
      <p className="text-destructive text-sm">{message}</p>
      <div className="flex flex-col gap-2">
        <Button onClick={onRetry} type="button">
          Try again
        </Button>
        <Button onClick={onSignOut} type="button" variant="outline">
          Sign out
        </Button>
      </div>
    </div>
  )
}

function LoginAuthForms({
  authBlocked,
  captchaRequired,
  captchaToken,
  captchaMisconfigured,
  clearCaptcha,
  features,
  onCaptchaToken,
  showSignIn,
  onShowSignIn,
  onShowSignUp,
}: {
  authBlocked: boolean
  captchaRequired: boolean
  captchaToken: string | null
  captchaMisconfigured: boolean
  clearCaptcha: () => void
  features: PublicIamFeatures
  onCaptchaToken: (token: string) => void
  showSignIn: boolean
  onShowSignIn: () => void
  onShowSignUp: () => void
}) {
  const showEmailPassword = features.emailPassword
  const showMagicLink = features.magicLink
  const showMagicLinkSection = showMagicLink && showSignIn
  const showDivider = features.github && (showEmailPassword || showMagicLink)

  return (
    <div className="mx-auto mt-10 w-full max-w-md space-y-6 p-6">
      <h1 className="text-center font-bold text-3xl">
        {showSignIn ? 'Welcome back' : 'Create your account'}
      </h1>

      {captchaMisconfigured ? (
        <p className="rounded-md border border-destructive/50 bg-destructive/10 p-3 text-destructive text-sm">
          CAPTCHA is enabled but{' '}
          <code className="text-xs">NEXT_PUBLIC_TURNSTILE_SITE_KEY</code> is not
          configured. Sign-in is temporarily unavailable.
        </p>
      ) : null}

      {captchaRequired ? (
        <TurnstileWidget onExpire={clearCaptcha} onToken={onCaptchaToken} />
      ) : null}

      <GitHubOAuthButton authBlocked={authBlocked} features={features} />

      {showDivider ? (
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">
              Or continue with email
            </span>
          </div>
        </div>
      ) : null}

      {showMagicLinkSection ? (
        <section className="space-y-2">
          <h2 className="font-medium text-sm">Magic link</h2>
          <MagicLinkForm
            authBlocked={authBlocked}
            captchaRequired={captchaRequired}
            captchaToken={captchaToken}
            clearCaptcha={clearCaptcha}
            features={features}
          />
        </section>
      ) : null}

      {showEmailPassword ? (
        <section className="space-y-2">
          {showMagicLinkSection ? (
            <h2 className="font-medium text-sm">Email and password</h2>
          ) : null}
          {showSignIn ? (
            <EmailSignInForm
              authBlocked={authBlocked}
              captchaRequired={captchaRequired}
              captchaToken={captchaToken}
              clearCaptcha={clearCaptcha}
              features={features}
              onSwitchToSignUp={onShowSignUp}
            />
          ) : (
            <EmailSignUpForm
              authBlocked={authBlocked}
              captchaRequired={captchaRequired}
              captchaToken={captchaToken}
              clearCaptcha={clearCaptcha}
              features={features}
              onSwitchToSignIn={onShowSignIn}
            />
          )}
        </section>
      ) : null}
    </div>
  )
}

export function LoginPage() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const redirectAfterAuth = usePostAuthRedirect()
  const { data: session, isPending: sessionPending } = iamClient.useSession()
  const { features, isError, isPending: featuresPending } = useIamFeatures()
  const [showSignIn, setShowSignIn] = useState(true)
  const [captchaToken, setCaptchaToken] = useState<string | null>(null)
  const [redirectState, setRedirectState] = useState<RedirectState | null>(null)

  const captchaEnabled = Boolean(features?.captcha)
  const hasTurnstileSiteKey = Boolean(env.NEXT_PUBLIC_TURNSTILE_SITE_KEY)
  const captchaRequired = captchaEnabled && hasTurnstileSiteKey
  const captchaMisconfigured = captchaEnabled && !hasTurnstileSiteKey
  const authBlocked = captchaMisconfigured

  function clearCaptcha() {
    setCaptchaToken(null)
  }

  function showSignInForm() {
    setShowSignIn(true)
  }

  function showSignUpForm() {
    setShowSignIn(false)
  }

  useEffect(() => {
    if (sessionPending || !session?.user) {
      setRedirectState(null)
      return
    }

    if (featuresPending) {
      return
    }

    let cancelled = false
    setRedirectState({ status: 'pending' })

    async function runPostAuthRedirect() {
      const result = await redirectAfterAuth(features)

      if (cancelled) {
        return
      }

      finishRedirect(setRedirectState, result)
    }

    runPostAuthRedirect().catch(() => {
      if (!cancelled) {
        failRedirect(setRedirectState)
      }
    })

    return () => {
      cancelled = true
    }
  }, [
    features,
    featuresPending,
    redirectAfterAuth,
    session?.user,
    sessionPending,
  ])

  function handleSignOut() {
    iamClient.signOut({
      fetchOptions: {
        onSuccess: () => {
          queryClient.clear()
          router.replace(routes.login)
        },
      },
    })
  }

  function handleRetry() {
    setRedirectState({ status: 'pending' })
    redirectAfterAuth(features)
      .then(result => finishRedirect(setRedirectState, result))
      .catch(() => failRedirect(setRedirectState))
  }

  if (sessionPending) {
    return <Loader />
  }

  if (session?.user) {
    if (redirectState?.status === 'error') {
      return (
        <LoginRedirectError
          message={redirectState.message}
          onRetry={handleRetry}
          onSignOut={handleSignOut}
        />
      )
    }

    return <Loader />
  }

  if (featuresPending) {
    return (
      <div className="mx-auto mt-10 w-full max-w-md space-y-4 p-6">
        <Skeleton className="mx-auto h-9 w-48" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    )
  }

  if (isError || !features || !hasAnyAuthMethod(features)) {
    return (
      <div className="mx-auto mt-10 w-full max-w-md p-6 text-center">
        <h1 className="mb-2 font-bold text-3xl">Sign in unavailable</h1>
        <p className="text-muted-foreground text-sm">
          No sign-in methods are enabled right now. Try again later or contact
          support.
        </p>
      </div>
    )
  }

  return (
    <LoginAuthForms
      authBlocked={authBlocked}
      captchaMisconfigured={captchaMisconfigured}
      captchaRequired={captchaRequired}
      captchaToken={captchaToken}
      clearCaptcha={clearCaptcha}
      features={features}
      onCaptchaToken={setCaptchaToken}
      onShowSignIn={showSignInForm}
      onShowSignUp={showSignUpForm}
      showSignIn={showSignIn}
    />
  )
}
