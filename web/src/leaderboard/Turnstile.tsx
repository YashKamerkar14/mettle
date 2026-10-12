// Cloudflare Turnstile widget. The script loads only when this component
// mounts, i.e. only after a visitor chooses to submit a result.

import { useEffect, useRef } from 'react'

declare global {
  interface Window {
    turnstile?: {
      render: (el: HTMLElement, opts: { sitekey: string; callback: (token: string) => void; 'expired-callback'?: () => void }) => string
      remove: (id: string) => void
    }
  }
}

const SCRIPT_SRC = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit'
let scriptPromise: Promise<void> | null = null

function loadScript(): Promise<void> {
  scriptPromise ??= new Promise((resolve, reject) => {
    const s = document.createElement('script')
    s.src = SCRIPT_SRC
    s.async = true
    s.onload = () => resolve()
    s.onerror = () => {
      scriptPromise = null
      reject(new Error('Could not load the spam check'))
    }
    document.head.appendChild(s)
  })
  return scriptPromise
}

export function Turnstile(props: { siteKey: string; onToken: (token: string | null) => void; onError: (e: Error) => void }) {
  const { siteKey, onToken, onError } = props
  const box = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let widgetId: string | null = null
    let cancelled = false
    loadScript().then(
      () => {
        if (cancelled || !box.current || !window.turnstile) return
        widgetId = window.turnstile.render(box.current, {
          sitekey: siteKey,
          callback: (token) => onToken(token),
          'expired-callback': () => onToken(null),
        })
      },
      (e) => onError(e),
    )
    return () => {
      cancelled = true
      if (widgetId && window.turnstile) window.turnstile.remove(widgetId)
    }
  }, [siteKey, onToken, onError])

  return <div ref={box} />
}
