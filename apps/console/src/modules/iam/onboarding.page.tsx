'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

import { Button } from '@repro-v2/ui/components/button'
import { Input } from '@repro-v2/ui/components/input'
import { Label } from '@repro-v2/ui/components/label'
import { useForm } from '@tanstack/react-form'
import { toast } from 'sonner'
import z from 'zod'

import Loader from '@/components/loader'
import { iamClient } from '@/lib/iam-client'
import { routes } from '@/lib/routes'

import { useIamFeatures } from './use-iam-features'
import { workspaceSlugFromName } from './workspace-slug'

const WORKSPACE_LIMIT = 2

export function OnboardingPage() {
  const router = useRouter()
  const { data: session, isPending: sessionPending } = iamClient.useSession()
  const { data: organizations, isPending: orgsPending } =
    iamClient.useListOrganizations()
  const { features, isPending: featuresPending } = useIamFeatures()

  useEffect(() => {
    if (sessionPending) {
      return
    }

    if (!session?.user) {
      router.replace(routes.login)
    }
  }, [router, session?.user, sessionPending])

  useEffect(() => {
    if (featuresPending || orgsPending || !features?.workspace) {
      return
    }

    if (!features.workspace) {
      router.replace(routes.dashboard)
      return
    }

    if ((organizations?.length ?? 0) > 0) {
      router.replace(routes.dashboard)
    }
  }, [
    features?.workspace,
    featuresPending,
    orgsPending,
    organizations?.length,
    router,
  ])

  const form = useForm({
    defaultValues: {
      name: '',
    },
    onSubmit: async ({ value }) => {
      const name = value.name.trim()
      const slug = workspaceSlugFromName(name)

      const { error } = await iamClient.organization.create({
        name,
        slug,
      })

      if (error) {
        toast.error(error.message ?? 'Could not create workspace')
        return
      }

      toast.success('Workspace created')
      router.push(routes.dashboard)
    },
    validators: {
      onSubmit: z.object({
        name: z.string().min(2, 'Name must be at least 2 characters'),
      }),
    },
  })

  if (
    sessionPending ||
    featuresPending ||
    orgsPending ||
    !session?.user ||
    !features?.workspace
  ) {
    return <Loader />
  }

  return (
    <main className="mx-auto mt-10 w-full max-w-md space-y-6 p-6">
      <div className="space-y-2 text-center">
        <h1 className="font-bold text-3xl">Create a workspace</h1>
        <p className="text-muted-foreground text-sm">
          You can create up to {WORKSPACE_LIMIT} workspaces per account.
        </p>
      </div>

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
              <Label htmlFor={field.name}>Workspace name</Label>
              <Input
                id={field.name}
                name={field.name}
                onBlur={field.handleBlur}
                onChange={event => field.handleChange(event.target.value)}
                placeholder="Acme Inc"
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

        <form.Subscribe
          selector={state => ({
            canSubmit: state.canSubmit,
            isSubmitting: state.isSubmitting,
          })}
        >
          {({ canSubmit, isSubmitting }) => (
            <Button
              className="w-full"
              disabled={!canSubmit || isSubmitting}
              type="submit"
            >
              {isSubmitting ? 'Creating…' : 'Create workspace'}
            </Button>
          )}
        </form.Subscribe>
      </form>
    </main>
  )
}
