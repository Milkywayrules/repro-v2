'use client'

import { useCallback, useState } from 'react'

import { Button } from '@repro-v2/ui/components/button'
import { Input } from '@repro-v2/ui/components/input'
import { Label } from '@repro-v2/ui/components/label'
import { useForm } from '@tanstack/react-form'
import { toast } from 'sonner'
import z from 'zod'

import { iamClient } from '@/lib/iam-client'

import { captchaFetchOptions } from './captcha-fetch-options'
import { TurnstileWidget } from './turnstile-widget'
import type { PublicIamFeatures } from './types'
import { usePostAuthRedirect } from './use-post-auth-redirect'

export function EmailSignInForm({
  authBlocked,
  captchaRequired,
  features,
  onSwitchToSignUp,
}: {
  authBlocked?: boolean
  captchaRequired: boolean
  features: PublicIamFeatures | undefined
  onSwitchToSignUp: () => void
}) {
  const redirectAfterAuth = usePostAuthRedirect()
  const [captchaToken, setCaptchaToken] = useState<string | null>(null)

  const clearCaptcha = useCallback(() => {
    setCaptchaToken(null)
  }, [])

  const form = useForm({
    defaultValues: {
      email: '',
      password: '',
    },
    onSubmit: async ({ value }) => {
      await iamClient.signIn.email(
        {
          email: value.email,
          password: value.password,
        },
        {
          ...captchaFetchOptions(captchaToken),
          onSuccess: async () => {
            toast.success('Sign in successful')
            await redirectAfterAuth(features)
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
        password: z.string().min(8, 'Password must be at least 8 characters'),
      }),
    },
  })

  if (!features?.emailPassword) {
    return null
  }

  return (
    <div className="space-y-4">
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

        <form.Field name="password">
          {field => (
            <div className="space-y-2">
              <Label htmlFor={field.name}>Password</Label>
              <Input
                disabled={authBlocked}
                id={field.name}
                name={field.name}
                onBlur={field.handleBlur}
                onChange={event => field.handleChange(event.target.value)}
                type="password"
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
              {isSubmitting ? 'Signing in…' : 'Sign in with email'}
            </Button>
          )}
        </form.Subscribe>
      </form>

      <div className="text-center">
        <Button onClick={onSwitchToSignUp} type="button" variant="link">
          Need an account? Sign up
        </Button>
      </div>
    </div>
  )
}

export function EmailSignUpForm({
  authBlocked,
  captchaRequired,
  features,
  onSwitchToSignIn,
}: {
  authBlocked?: boolean
  captchaRequired: boolean
  features: PublicIamFeatures | undefined
  onSwitchToSignIn: () => void
}) {
  const redirectAfterAuth = usePostAuthRedirect()
  const [captchaToken, setCaptchaToken] = useState<string | null>(null)

  const clearCaptcha = useCallback(() => {
    setCaptchaToken(null)
  }, [])

  const form = useForm({
    defaultValues: {
      email: '',
      name: '',
      password: '',
    },
    onSubmit: async ({ value }) => {
      await iamClient.signUp.email(
        {
          email: value.email,
          name: value.name,
          password: value.password,
        },
        {
          ...captchaFetchOptions(captchaToken),
          onSuccess: async () => {
            toast.success('Account created')
            await redirectAfterAuth(features)
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
        name: z.string().min(2, 'Name must be at least 2 characters'),
        email: z.email('Invalid email address'),
        password: z.string().min(8, 'Password must be at least 8 characters'),
      }),
    },
  })

  if (!features?.emailPassword) {
    return null
  }

  return (
    <div className="space-y-4">
      <form
        className="space-y-4"
        onSubmit={event => {
          event.preventDefault()
          event.stopPropagation()
          form.handleSubmit()
        }}
      >
        <form.Field name="name">
          {field => (
            <div className="space-y-2">
              <Label htmlFor={field.name}>Name</Label>
              <Input
                disabled={authBlocked}
                id={field.name}
                name={field.name}
                onBlur={field.handleBlur}
                onChange={event => field.handleChange(event.target.value)}
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

        <form.Field name="password">
          {field => (
            <div className="space-y-2">
              <Label htmlFor={field.name}>Password</Label>
              <Input
                disabled={authBlocked}
                id={field.name}
                name={field.name}
                onBlur={field.handleBlur}
                onChange={event => field.handleChange(event.target.value)}
                type="password"
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
              {isSubmitting ? 'Creating account…' : 'Create account'}
            </Button>
          )}
        </form.Subscribe>
      </form>

      <div className="text-center">
        <Button onClick={onSwitchToSignIn} type="button" variant="link">
          Already have an account? Sign in
        </Button>
      </div>
    </div>
  )
}
