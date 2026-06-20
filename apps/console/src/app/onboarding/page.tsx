import { Suspense } from 'react'

import { ClientOnly } from '@/components/client-only'
import Loader from '@/components/loader'
import { OnboardingPage } from '@/modules/iam/onboarding.page'

export default function Page() {
  return (
    <Suspense fallback={<Loader />}>
      <ClientOnly fallback={<Loader />}>
        <OnboardingPage />
      </ClientOnly>
    </Suspense>
  )
}
