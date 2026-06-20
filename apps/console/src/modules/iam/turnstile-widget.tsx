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

export function TurnstileWidget({
  onExpire,
  onToken,
}: {
  onExpire: () => void
  onToken: (token: string) => void
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const widgetIdRef = useRef<string | null>(null)
  const siteKey = env.NEXT_PUBLIC_TURNSTILE_SITE_KEY

  useEffect(() => {
    if (!(siteKey && containerRef.current)) {
      return
    }

    function renderWidget() {
      const container = containerRef.current
      if (!(container && window.turnstile && siteKey)) {
        return
      }

      widgetIdRef.current = window.turnstile.render(container, {
        sitekey: siteKey,
        callback: onToken,
        'expired-callback': onExpire,
        'error-callback': onExpire,
      })
    }

    if (window.turnstile) {
      renderWidget()
    } else {
      window.onTurnstileLoad = renderWidget

      if (!document.querySelector(`script[src="${TURNSTILE_SCRIPT}"]`)) {
        const script = document.createElement('script')
        script.src = TURNSTILE_SCRIPT
        script.async = true
        document.head.appendChild(script)
      }
    }

    return () => {
      if (widgetIdRef.current && window.turnstile) {
        window.turnstile.remove(widgetIdRef.current)
        widgetIdRef.current = null
      }
    }
  }, [onExpire, onToken])

  if (!siteKey) {
    return null
  }

  return <div ref={containerRef} />
}
