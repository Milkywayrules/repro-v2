import React from 'react'

import { AppProviders } from '@repro-v2/ui/providers/app-providers'
import ReactDOM from 'react-dom/client'

import App from './App.tsx'

import './style.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    {/* onUnauthorized / isUnauthorized omitted until extension calls the API */}
    <AppProviders showQueryDevtools={false}>
      <App />
    </AppProviders>
  </React.StrictMode>,
)
