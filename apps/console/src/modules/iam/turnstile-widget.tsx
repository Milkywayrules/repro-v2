'use client'

import { useEffect, useRef } from 'react'

import { env } from '@repro-v2/env/console'

interface TurnstileApi {
  remove: (widgetId: string) => void
  render: (
    container: HTMLElement,
    options: {
      callback: (token: string) => void
      'error-callback'?: () => void
      'expired-callback'?: () => void
      sitekey: string
    },
  ) => string
}

declare global {
  interface Window {
    onTurnstileLoad?: () => void
    turnstile?: TurnstileApi
  }
}

const TURNSTILE_SCRIPT =
  'https://challenges.cloudflare.com/turnstile/v0/api.js?onload=onTurnstileLoad'

const turnstileLoadCallbacks = new Set<() => void>()

function invokeTurnstileLoadCallbacks() {
  for (const callback of turnstileLoadCallbacks) {
    callback()
  }
}

function ensureTurnstileScript() {
  if (window.turnstile) {
    invokeTurnstileLoadCallbacks()
    return
  }

  const previousOnLoad = window.onTurnstileLoad
  window.onTurnstileLoad = () => {
    previousOnLoad?.()
    invokeTurnstileLoadCallbacks()
  }

  if (!document.querySelector(`script[src="${TURNSTILE_SCRIPT}"]`)) {
    const script = document.createElement('script')
    script.src = TURNSTILE_SCRIPT
    script.async = true
    document.head.appendChild(script)
  }
}

export function TurnstileWidget({
  onError,
  onExpire,
  onToken,
}: {
  onError?: () => void
  onExpire: () => void
  onToken: (token: string) => void
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const widgetIdRef = useRef<string | null>(null)
  const onErrorRef = useRef(onError)
  const onExpireRef = useRef(onExpire)
  const onTokenRef = useRef(onToken)
  const siteKey = env.NEXT_PUBLIC_TURNSTILE_SITE_KEY

  onErrorRef.current = onError
  onExpireRef.current = onExpire
  onTokenRef.current = onToken

  useEffect(() => {
    if (!(siteKey && containerRef.current)) {
      return
    }

    function renderWidget() {
      const container = containerRef.current
      if (!(container && window.turnstile && siteKey)) {
        return
      }

      if (widgetIdRef.current) {
        return
      }

      widgetIdRef.current = window.turnstile.render(container, {
        sitekey: siteKey,
        callback: token => onTokenRef.current(token),
        'expired-callback': () => onExpireRef.current(),
        'error-callback': () => onErrorRef.current?.() ?? onExpireRef.current(),
      })
    }

    turnstileLoadCallbacks.add(renderWidget)
    ensureTurnstileScript()

    if (window.turnstile) {
      renderWidget()
    }

    return () => {
      turnstileLoadCallbacks.delete(renderWidget)

      if (widgetIdRef.current && window.turnstile) {
        window.turnstile.remove(widgetIdRef.current)
        widgetIdRef.current = null
      }
    }
  }, [])

  if (!siteKey) {
    return null
  }

  return <div ref={containerRef} />
}
