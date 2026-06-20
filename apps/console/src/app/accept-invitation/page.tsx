import { Suspense } from 'react'

import { ClientOnly } from '@/components/client-only'
import Loader from '@/components/loader'
import { AcceptInvitationPage } from '@/modules/iam/accept-invitation.page'

export default function Page() {
  return (
    <Suspense fallback={<Loader />}>
      <ClientOnly fallback={<Loader />}>
        <AcceptInvitationPage />
      </ClientOnly>
    </Suspense>
  )
}
