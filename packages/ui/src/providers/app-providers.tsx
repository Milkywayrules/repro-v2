'use client'

import type * as React from 'react'
import { useRef, useState } from 'react'

import { QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { ThemeProvider } from 'next-themes'
import { NuqsAdapter as NextNuqsAdapter } from 'nuqs/adapters/next/app'
import { NuqsAdapter as SpaNuqsAdapter } from 'nuqs/adapters/react'

import { Toaster } from '../components/sonner'
import {
  type CreateAppQueryClientOptions,
  createAppQueryClient,
} from './create-app-query-client'

type NuqsMode = 'next-app' | 'spa' | false

export type AppProvidersProps = {
  children: React.ReactNode
  nuqs?: NuqsMode
} & CreateAppQueryClientOptions

function NuqsWrapper({
  mode,
  children,
}: {
  mode: NuqsMode
  children: React.ReactNode
}) {
  if (mode === 'next-app') {
    return <NextNuqsAdapter>{children}</NextNuqsAdapter>
  }

  if (mode === 'spa') {
    return <SpaNuqsAdapter>{children}</SpaNuqsAdapter>
  }

  return children
}

export function AppProviders({
  children,
  onUnauthorized,
  isUnauthorized,
  nuqs = false,
}: AppProvidersProps) {
  const onUnauthorizedRef = useRef(onUnauthorized)
  onUnauthorizedRef.current = onUnauthorized

  const [queryClient] = useState(() =>
    createAppQueryClient({
      isUnauthorized,
      onUnauthorized: () => {
        onUnauthorizedRef.current?.()
      },
    }),
  )

  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      disableTransitionOnChange
      enableSystem
    >
      <QueryClientProvider client={queryClient}>
        <NuqsWrapper mode={nuqs}>
          {children}
          <Toaster richColors />
        </NuqsWrapper>
        {process.env.NODE_ENV === 'development' ? (
          <ReactQueryDevtools initialIsOpen={false} />
        ) : null}
      </QueryClientProvider>
    </ThemeProvider>
  )
}
