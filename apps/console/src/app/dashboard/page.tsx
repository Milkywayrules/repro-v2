'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

import { ClientOnly } from '@/components/client-only'
import { Loader } from '@/components/loader'
import { PageErrorState } from '@/components/page-error-state'
import { iamClient } from '@/lib/iam-client'
import { routes } from '@/lib/routes'
import { Dashboard } from '@/modules/dashboard/dashboard'
import { FlatRouteGuard } from '@/modules/iam/flat-route-guard'
import { useOnboardingGate } from '@/modules/iam/use-onboarding-gate'

export default function DashboardPage() {
  return (
    <ClientOnly fallback={<Loader />}>
      <FlatRouteGuard subPath="dashboard">
        <DashboardPageClient />
      </FlatRouteGuard>
    </ClientOnly>
  )
}

function DashboardPageClient() {
  const router = useRouter()
  const { data: session, isPending } = iamClient.useSession()

  useEffect(() => {
    if (!(isPending || session?.user)) {
      router.replace(routes.login)
    }
  }, [isPending, router, session?.user])

  const { error: onboardingError, isChecking: onboardingChecking } =
    useOnboardingGate(session?.user?.id)

  if (isPending || !session?.user || onboardingChecking) {
    return <Loader />
  }

  if (onboardingError) {
    return (
      <PageErrorState message={onboardingError} title="Could not continue" />
    )
  }

  return (
    <div>
      <h1>Dashboard</h1>
      <p>Welcome {session.user.name}</p>
      <Dashboard />
    </div>
  )
}
