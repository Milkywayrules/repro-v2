import { Suspense } from 'react'

import { ClientOnly } from '@/components/client-only'
import { Loader } from '@/components/loader'
import { LoginPage } from '@/modules/iam/login.page'

export default function Page() {
  return (
    <Suspense fallback={<Loader />}>
      <ClientOnly fallback={<Loader />}>
        <LoginPage />
      </ClientOnly>
    </Suspense>
  )
}
