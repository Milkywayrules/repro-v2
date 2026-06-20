import React from 'react'

import { isTreatyUnauthorized } from '@repro-v2/api-client'
import { AppProviders } from '@repro-v2/ui/providers/app-providers'
import ReactDOM from 'react-dom/client'

import { authClient } from '@/lib/auth-client'

import App from './App.tsx'

import './style.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AppProviders
      isUnauthorized={isTreatyUnauthorized}
      onUnauthorized={() => {
        authClient.signOut().catch(() => {
          /* best-effort session clear after 401 */
        })
      }}
      showQueryDevtools={false}
    >
      <App />
    </AppProviders>
  </React.StrictMode>,
)
