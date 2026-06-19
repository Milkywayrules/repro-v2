import { useState } from 'react'

import { readyQueryOptions } from '@repro-v2/api-client/queries'
import { useQuery } from '@tanstack/react-query'

import reactLogo from '@/assets/react.svg'
import { apiClient } from '@/lib/api-client'

import wxtLogo from '/wxt.svg'

import './App.css'

function ReadyDot() {
  const { data, isPending, isError } = useQuery(readyQueryOptions(apiClient))
  const ready = !(isPending || isError) && data?.status === 'ready'

  let ariaLabel = 'API not ready'
  if (isPending) {
    ariaLabel = 'Checking API readiness'
  } else if (ready) {
    ariaLabel = 'API ready'
  }

  let dotClass = 'bg-destructive'
  if (isPending) {
    dotClass = 'bg-muted-foreground/40'
  } else if (ready) {
    dotClass = 'bg-green-500'
  }

  return (
    <span
      aria-label={ariaLabel}
      className={`inline-block size-2.5 rounded-full ${dotClass}`}
      role="status"
      title={ready ? 'API ready' : 'API not ready'}
    />
  )
}

function App() {
  const [count, setCount] = useState(0)

  return (
    <>
      <div className="flex items-center justify-end gap-2">
        <ReadyDot />
      </div>
      <div>
        <a href="https://wxt.dev" rel="noopener" target="_blank">
          <img alt="WXT logo" className="logo" src={wxtLogo} />
        </a>
        <a href="https://react.dev" rel="noopener" target="_blank">
          <img alt="React logo" className="logo react" src={reactLogo} />
        </a>
      </div>
      <h1>WXT + React</h1>
      <div className="card">
        <button onClick={() => setCount(count => count + 1)}>
          count is {count}
        </button>
        <p>
          Edit <code>src/entrypoints/popup/App.tsx</code> and save to test HMR
        </p>
      </div>
      <p className="read-the-docs">
        Click on the WXT and React logos to learn more
      </p>
    </>
  )
}

export default App
