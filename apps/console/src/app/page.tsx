'use client'

import { useEffect } from 'react'
import type { Route } from 'next'
import { useRouter } from 'next/navigation'

import { iamFeaturesQueryOptions } from '@repro-v2/api-client/queries'
import { useQuery } from '@tanstack/react-query'

import { ClientOnly } from '@/components/client-only'
import { Loader } from '@/components/loader'
import { apiClient } from '@/lib/api-client'
import { routes } from '@/lib/routes'
import { pickDefaultWorkspaceSlug } from '@/modules/iam/list-workspaces'

export default function HomePage() {
  return (
    <ClientOnly fallback={<Loader />}>
      <HomeRedirect />
    </ClientOnly>
  )
}

function HomeRedirect() {
  const router = useRouter()
  const { data: featuresResponse, isPending } = useQuery(
    iamFeaturesQueryOptions(apiClient),
  )

  useEffect(() => {
    if (isPending) {
      return
    }

    let cancelled = false

    async function redirectHome() {
      const features = featuresResponse?.data

      if (!features?.workspace) {
        if (!cancelled) {
          router.replace('/dashboard' as Route)
        }
        return
      }

      const slug = await pickDefaultWorkspaceSlug()
      if (!cancelled) {
        if (slug) {
          router.replace(`/${slug}/dashboard` as Route)
        } else {
          router.replace(routes.onboarding as Route)
        }
      }
    }

    redirectHome().catch(() => {
      if (!cancelled) {
        router.replace(routes.login as Route)
      }
    })

    return () => {
      cancelled = true
    }
  }, [featuresResponse?.data, isPending, router])

  return <Loader />
}
