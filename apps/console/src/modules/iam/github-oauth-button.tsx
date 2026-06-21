'use client'

import { useState } from 'react'

import { Button } from '@repro-v2/ui/components/button'
import { parseAsString, useQueryState } from 'nuqs'

import { InlineErrorCallout } from '@/components/inline-error-callout'
import { iamClient } from '@/lib/iam-client'
import { searchParams } from '@/lib/search-params'

import { buildAuthCallbackUrl } from './auth-redirect'
import { captchaFetchOptions } from './captcha-fetch-options'

export function GitHubOAuthButton({
  authBlocked,
  captchaRequired,
  captchaToken,
  clearCaptcha,
  features,
}: {
  authBlocked?: boolean
  captchaRequired: boolean
  captchaToken: string | null
  clearCaptcha: () => void
  features: { github: boolean; workspace?: boolean } | undefined
}) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [oauthError, setOauthError] = useState<string | null>(null)
  const [nextPath] = useQueryState(searchParams.next, parseAsString)

  async function handleSignIn() {
    setIsSubmitting(true)
    setOauthError(null)

    try {
      await iamClient.signIn.social(
        {
          provider: 'github',
          callbackURL: buildAuthCallbackUrl(nextPath, {
            workspace: features?.workspace,
          }),
        },
        {
          ...captchaFetchOptions(captchaToken),
          onError: error => {
            setIsSubmitting(false)
            clearCaptcha()
            setOauthError(
              error.error.message ||
                error.error.statusText ||
                'GitHub sign-in failed. Try again.',
            )
          },
        },
      )
    } catch {
      setIsSubmitting(false)
      setOauthError('GitHub sign-in failed. Try again.')
    }
  }

  if (!features?.github) {
    return null
  }

  return (
    <div className="space-y-2">
      <Button
        className="w-full"
        disabled={
          authBlocked || isSubmitting || (captchaRequired && !captchaToken)
        }
        onClick={handleSignIn}
        type="button"
        variant="outline"
      >
        {isSubmitting ? 'Redirecting…' : 'Continue with GitHub'}
      </Button>
      {oauthError ? (
        <InlineErrorCallout className="text-left">
          {oauthError}
        </InlineErrorCallout>
      ) : null}
    </div>
  )
}
