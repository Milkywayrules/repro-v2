'use client'

import { useState } from 'react'

import { Button } from '@repro-v2/ui/components/button'
import { Input } from '@repro-v2/ui/components/input'
import { Label } from '@repro-v2/ui/components/label'
import { useForm } from '@tanstack/react-form'
import { toast } from 'sonner'
import z from 'zod'

import { InlineErrorCallout } from '@/components/inline-error-callout'
import { iamClient } from '@/lib/iam-client'

import { captchaFetchOptions } from './captcha-fetch-options'
import type { PublicIamFeatures } from './types'
import { usePostAuthRedirect } from './use-post-auth-redirect'

function FieldErrors({
  errors,
  fieldName,
}: {
  errors: Array<{ message?: string } | undefined>
  fieldName: string
}) {
  if (errors.length === 0) {
    return null
  }

  const errorId = `${fieldName}-error`

  return (
    <>
      {errors.map(error => (
        <p
          className="text-destructive text-sm"
          id={errorId}
          key={error?.message}
          role="alert"
        >
          {error?.message}
        </p>
      ))}
    </>
  )
}

export function EmailSignInForm({
  authBlocked,
  captchaRequired,
  captchaToken,
  clearCaptcha,
  features,
  onSwitchToSignUp,
}: {
  authBlocked?: boolean
  captchaRequired: boolean
  captchaToken: string | null
  clearCaptcha: () => void
  features: PublicIamFeatures | undefined
  onSwitchToSignUp: () => void
}) {
  const redirectAfterAuth = usePostAuthRedirect()
  const [submitError, setSubmitError] = useState<string | null>(null)

  const form = useForm({
    defaultValues: {
      email: '',
      password: '',
    },
    onSubmit: async ({ value }) => {
      setSubmitError(null)
      await iamClient.signIn.email(
        {
          email: value.email,
          password: value.password,
        },
        {
          ...captchaFetchOptions(captchaToken),
          onSuccess: async () => {
            toast.success('Sign in successful')
            const result = await redirectAfterAuth(features)
            if (!result.ok) {
              toast.error(result.error)
            }
          },
          onError: error => {
            clearCaptcha()
            setSubmitError(
              error.error.message ||
                error.error.statusText ||
                'Sign in failed. Check your email and password.',
            )
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
          {field => {
            const errorId = `${field.name}-error`
            const hasError = field.state.meta.errors.length > 0

            return (
              <div className="space-y-2">
                <Label htmlFor={field.name}>Email</Label>
                <Input
                  aria-describedby={hasError ? errorId : undefined}
                  aria-invalid={hasError}
                  disabled={authBlocked}
                  id={field.name}
                  name={field.name}
                  onBlur={field.handleBlur}
                  onChange={event => field.handleChange(event.target.value)}
                  type="email"
                  value={field.state.value}
                />
                <FieldErrors
                  errors={field.state.meta.errors}
                  fieldName={field.name}
                />
              </div>
            )
          }}
        </form.Field>

        <form.Field name="password">
          {field => {
            const errorId = `${field.name}-error`
            const hasError = field.state.meta.errors.length > 0

            return (
              <div className="space-y-2">
                <Label htmlFor={field.name}>Password</Label>
                <Input
                  aria-describedby={hasError ? errorId : undefined}
                  aria-invalid={hasError}
                  disabled={authBlocked}
                  id={field.name}
                  name={field.name}
                  onBlur={field.handleBlur}
                  onChange={event => field.handleChange(event.target.value)}
                  type="password"
                  value={field.state.value}
                />
                <FieldErrors
                  errors={field.state.meta.errors}
                  fieldName={field.name}
                />
              </div>
            )
          }}
        </form.Field>

        {submitError ? (
          <InlineErrorCallout>{submitError}</InlineErrorCallout>
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
  captchaToken,
  clearCaptcha,
  features,
  onSwitchToSignIn,
}: {
  authBlocked?: boolean
  captchaRequired: boolean
  captchaToken: string | null
  clearCaptcha: () => void
  features: PublicIamFeatures | undefined
  onSwitchToSignIn: () => void
}) {
  const redirectAfterAuth = usePostAuthRedirect()
  const [submitError, setSubmitError] = useState<string | null>(null)

  const form = useForm({
    defaultValues: {
      email: '',
      name: '',
      password: '',
    },
    onSubmit: async ({ value }) => {
      setSubmitError(null)
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
            const result = await redirectAfterAuth(features)
            if (!result.ok) {
              toast.error(result.error)
            }
          },
          onError: error => {
            clearCaptcha()
            setSubmitError(
              error.error.message ||
                error.error.statusText ||
                'Could not create account. Try again.',
            )
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
          {field => {
            const errorId = `${field.name}-error`
            const hasError = field.state.meta.errors.length > 0

            return (
              <div className="space-y-2">
                <Label htmlFor={field.name}>Name</Label>
                <Input
                  aria-describedby={hasError ? errorId : undefined}
                  aria-invalid={hasError}
                  disabled={authBlocked}
                  id={field.name}
                  name={field.name}
                  onBlur={field.handleBlur}
                  onChange={event => field.handleChange(event.target.value)}
                  value={field.state.value}
                />
                <FieldErrors
                  errors={field.state.meta.errors}
                  fieldName={field.name}
                />
              </div>
            )
          }}
        </form.Field>

        <form.Field name="email">
          {field => {
            const errorId = `${field.name}-error`
            const hasError = field.state.meta.errors.length > 0

            return (
              <div className="space-y-2">
                <Label htmlFor={field.name}>Email</Label>
                <Input
                  aria-describedby={hasError ? errorId : undefined}
                  aria-invalid={hasError}
                  disabled={authBlocked}
                  id={field.name}
                  name={field.name}
                  onBlur={field.handleBlur}
                  onChange={event => field.handleChange(event.target.value)}
                  type="email"
                  value={field.state.value}
                />
                <FieldErrors
                  errors={field.state.meta.errors}
                  fieldName={field.name}
                />
              </div>
            )
          }}
        </form.Field>

        <form.Field name="password">
          {field => {
            const errorId = `${field.name}-error`
            const hasError = field.state.meta.errors.length > 0

            return (
              <div className="space-y-2">
                <Label htmlFor={field.name}>Password</Label>
                <Input
                  aria-describedby={hasError ? errorId : undefined}
                  aria-invalid={hasError}
                  disabled={authBlocked}
                  id={field.name}
                  name={field.name}
                  onBlur={field.handleBlur}
                  onChange={event => field.handleChange(event.target.value)}
                  type="password"
                  value={field.state.value}
                />
                <FieldErrors
                  errors={field.state.meta.errors}
                  fieldName={field.name}
                />
              </div>
            )
          }}
        </form.Field>

        {submitError ? (
          <InlineErrorCallout>{submitError}</InlineErrorCallout>
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
