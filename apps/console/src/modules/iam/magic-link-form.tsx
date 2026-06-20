'use client'

import { useCallback, useState } from 'react'

import { env } from '@repro-v2/env/console'
import { Button } from '@repro-v2/ui/components/button'
import { Input } from '@repro-v2/ui/components/input'
import { Label } from '@repro-v2/ui/components/label'
import { useForm } from '@tanstack/react-form'
import { parseAsString, useQueryState } from 'nuqs'
import { toast } from 'sonner'
import z from 'zod'

import { iamClient } from '@/lib/iam-client'
import { routes } from '@/lib/routes'
import { searchParams } from '@/lib/search-params'

import { buildAuthCallbackUrl } from './auth-redirect'
import { captchaFetchOptions } from './captcha-fetch-options'
import { TurnstileWidget } from './turnstile-widget'

export function MagicLinkForm({
  authBlocked,
  captchaRequired,
  features,
}: {
  authBlocked?: boolean
  captchaRequired: boolean
  features: { magicLink: boolean } | undefined
}) {
  const [captchaToken, setCaptchaToken] = useState<string | null>(null)
  const [sent, setSent] = useState(false)
  const [nextPath] = useQueryState(searchParams.next, parseAsString)

  const clearCaptcha = useCallback(() => {
    setCaptchaToken(null)
  }, [])

  const form = useForm({
    defaultValues: {
      email: '',
    },
    onSubmit: async ({ value }) => {
      await iamClient.signIn.magicLink(
        {
          email: value.email,
          callbackURL: buildAuthCallbackUrl(nextPath),
          errorCallbackURL: `${env.NEXT_PUBLIC_CONSOLE_URL}${routes.login}`,
        },
        {
          ...captchaFetchOptions(captchaToken),
          onSuccess: () => {
            setSent(true)
            toast.success('Check your email for a sign-in link')
          },
          onError: error => {
            clearCaptcha()
            toast.error(error.error.message || error.error.statusText)
          },
        },
      )
    },
    validators: {
      onSubmit: z.object({
        email: z.email('Invalid email address'),
      }),
    },
  })

  if (!features?.magicLink) {
    return null
  }

  if (sent) {
    return (
      <p className="text-center text-muted-foreground text-sm">
        We sent a sign-in link to your email. You can close this tab after
        signing in.
      </p>
    )
  }

  return (
    <form
      className="space-y-4"
      onSubmit={event => {
        event.preventDefault()
        event.stopPropagation()
        form.handleSubmit()
      }}
    >
      <form.Field name="email">
        {field => (
          <div className="space-y-2">
            <Label htmlFor={field.name}>Email</Label>
            <Input
              disabled={authBlocked}
              id={field.name}
              name={field.name}
              onBlur={field.handleBlur}
              onChange={event => field.handleChange(event.target.value)}
              placeholder="you@example.com"
              type="email"
              value={field.state.value}
            />
            {field.state.meta.errors.map(error => (
              <p className="text-destructive text-sm" key={error?.message}>
                {error?.message}
              </p>
            ))}
          </div>
        )}
      </form.Field>

      {captchaRequired ? (
        <TurnstileWidget onExpire={clearCaptcha} onToken={setCaptchaToken} />
      ) : null}

      <form.Subscribe
        selector={state => ({
          canSubmit: state.canSubmit,
          isSubmitting: state.isSubmitting,
        })}
      >
        {({ canSubmit, isSubmitting }) => (
          <Button
            className="w-full"
            disabled={
              authBlocked ||
              !canSubmit ||
              isSubmitting ||
              (captchaRequired && !captchaToken)
            }
            type="submit"
          >
            {isSubmitting ? 'Sending link…' : 'Email me a sign-in link'}
          </Button>
        )}
      </form.Subscribe>
    </form>
  )
}
