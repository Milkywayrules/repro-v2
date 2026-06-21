'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

import { ClientOnly } from '@/components/client-only'
import { Loader } from '@/components/loader'
import { iamClient } from '@/lib/iam-client'
import { routes } from '@/lib/routes'
import { useOnboardingGate } from '@/modules/iam/use-onboarding-gate'

import { Dashboard } from './dashboard'

export default function DashboardPage() {
  return (
    <ClientOnly fallback={<Loader />}>
      <DashboardPageClient />
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
      <div className="mx-auto mt-10 w-full max-w-md p-6 text-center">
        <p className="text-destructive text-sm">{onboardingError}</p>
      </div>
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
