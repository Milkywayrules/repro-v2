'use client'

import { useEffect, useState } from 'react'

import { env } from '@repro-v2/env/console'
import { Skeleton } from '@repro-v2/ui/components/skeleton'

import Loader from '@/components/loader'
import { iamClient } from '@/lib/iam-client'

import { EmailSignInForm, EmailSignUpForm } from './email-auth-forms'
import { GitHubOAuthButton } from './github-oauth-button'
import { MagicLinkForm } from './magic-link-form'
import { useIamFeatures } from './use-iam-features'
import { usePostAuthRedirect } from './use-post-auth-redirect'

function hasAnyAuthMethod(
  features:
    | {
        emailPassword: boolean
        github: boolean
        magicLink: boolean
      }
    | undefined,
) {
  if (!features) {
    return false
  }

  return features.emailPassword || features.magicLink || features.github
}

export function LoginPage() {
  const redirectAfterAuth = usePostAuthRedirect()
  const { data: session, isPending: sessionPending } = iamClient.useSession()
  const { features, isError, isPending: featuresPending } = useIamFeatures()
  const [showSignIn, setShowSignIn] = useState(true)

  const captchaEnabled = Boolean(features?.captcha)
  const hasTurnstileSiteKey = Boolean(env.NEXT_PUBLIC_TURNSTILE_SITE_KEY)
  const captchaRequired = captchaEnabled && hasTurnstileSiteKey
  const captchaMisconfigured = captchaEnabled && !hasTurnstileSiteKey
  const authBlocked = captchaMisconfigured

  useEffect(() => {
    if (sessionPending || !session?.user) {
      return
    }

    redirectAfterAuth(features).catch(() => undefined)
  }, [features, redirectAfterAuth, session?.user, sessionPending])

  if (sessionPending || session?.user) {
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

  const showEmailPassword = features.emailPassword
  const showMagicLink = features.magicLink
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

      {showMagicLink && showSignIn ? (
        <section className="space-y-2">
          <h2 className="font-medium text-sm">Magic link</h2>
          <MagicLinkForm
            authBlocked={authBlocked}
            captchaRequired={captchaRequired}
            features={features}
          />
        </section>
      ) : null}

      {showEmailPassword ? (
        <section className="space-y-2">
          {showMagicLink && showSignIn ? (
            <h2 className="font-medium text-sm">Email and password</h2>
          ) : null}
          {showSignIn ? (
            <EmailSignInForm
              authBlocked={authBlocked}
              captchaRequired={captchaRequired}
              features={features}
              onSwitchToSignUp={() => setShowSignIn(false)}
            />
          ) : (
            <EmailSignUpForm
              authBlocked={authBlocked}
              captchaRequired={captchaRequired}
              features={features}
              onSwitchToSignIn={() => setShowSignIn(true)}
            />
          )}
        </section>
      ) : null}
    </div>
  )
}
