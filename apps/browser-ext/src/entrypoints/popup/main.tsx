import React from 'react'

import ReactDOM from 'react-dom/client'

import { PopupProviders } from '@/components/providers'

import App from './App.tsx'

import './style.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <PopupProviders>
      <App />
    </PopupProviders>
  </React.StrictMode>,
)
