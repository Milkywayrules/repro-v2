'use client'

import { useState } from 'react'

import { Button } from '@repro-v2/ui/components/button'
import { parseAsString, useQueryState } from 'nuqs'
import { toast } from 'sonner'

import { iamClient } from '@/lib/iam-client'
import { searchParams } from '@/lib/search-params'

import { buildAuthCallbackUrl } from './auth-redirect'

export function GitHubOAuthButton({
  authBlocked,
  features,
}: {
  authBlocked?: boolean
  features: { github: boolean } | undefined
}) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [nextPath] = useQueryState(searchParams.next, parseAsString)

  async function handleSignIn() {
    setIsSubmitting(true)

    try {
      await iamClient.signIn.social(
        {
          provider: 'github',
          callbackURL: buildAuthCallbackUrl(nextPath),
        },
        {
          onError: error => {
            setIsSubmitting(false)
            toast.error(error.error.message || error.error.statusText)
          },
        },
      )
    } catch {
      setIsSubmitting(false)
    }
  }

  if (!features?.github) {
    return null
  }

  return (
    <Button
      className="w-full"
      disabled={authBlocked || isSubmitting}
      onClick={handleSignIn}
      type="button"
      variant="outline"
    >
      {isSubmitting ? 'Redirecting…' : 'Continue with GitHub'}
    </Button>
  )
}
