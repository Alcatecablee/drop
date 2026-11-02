import { useEffect, useRef } from 'react'

declare global {
  interface Window {
    turnstile?: {
      render: (
        container: HTMLElement | string,
        params: {
          sitekey: string
          callback: (token: string) => void
          'error-callback'?: (errorCode?: string) => void
          'expired-callback'?: () => void
          theme?: 'light' | 'dark' | 'auto'
          size?: 'normal' | 'compact' | 'flexible'
        }
      ) => string
      reset: (widgetId?: string) => void
      remove: (widgetId?: string) => void
    }
  }
}

interface TurnstileWidgetProps {
  onVerify: (token: string) => void
  onExpire?: () => void
  onError?: (err?: string) => void
  resetKey?: number
}

export function TurnstileWidget({
  onVerify,
  onExpire,
  onError,
  resetKey = 0,
}: TurnstileWidgetProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const widgetIdRef = useRef<string | null>(null)
  const siteKey = import.meta.env.VITE_TURNSTILE_SITE_KEY

  // Store latest callbacks in refs so changes in parent state do not re-trigger widget lifecycle
  const onVerifyRef = useRef(onVerify)
  const onExpireRef = useRef(onExpire)
  const onErrorRef = useRef(onError)

  useEffect(() => {
    onVerifyRef.current = onVerify
    onExpireRef.current = onExpire
    onErrorRef.current = onError
  })

  useEffect(() => {
    if (!siteKey) return

    let isMounted = true

    function renderWidget() {
      if (!isMounted || !containerRef.current || !window.turnstile) return

      try {
        if (widgetIdRef.current) {
          window.turnstile.remove(widgetIdRef.current)
          widgetIdRef.current = null
        }

        const widgetId = window.turnstile.render(containerRef.current, {
          sitekey: siteKey,
          callback: (token: string) => {
            if (isMounted) onVerifyRef.current?.(token)
          },
          'expired-callback': () => {
            if (isMounted) onExpireRef.current?.()
          },
          'error-callback': (code?: string) => {
            if (isMounted) onErrorRef.current?.(code)
          },
          theme: 'light',
        })

        widgetIdRef.current = widgetId
      } catch (err) {
        console.warn('[Turnstile] Render error:', err)
      }
    }

    if (window.turnstile) {
      renderWidget()
    } else {
      const scriptId = 'cf-turnstile-script'
      let script = document.getElementById(scriptId) as HTMLScriptElement | null
      if (!script) {
        script = document.createElement('script')
        script.id = scriptId
        script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit'
        script.async = true
        script.defer = true
        document.head.appendChild(script)
      }

      const checkInterval = setInterval(() => {
        if (window.turnstile) {
          clearInterval(checkInterval)
          renderWidget()
        }
      }, 100)

      return () => {
        clearInterval(checkInterval)
        isMounted = false
        if (widgetIdRef.current && window.turnstile) {
          try {
            window.turnstile.remove(widgetIdRef.current)
          } catch {}
        }
      }
    }

    return () => {
      isMounted = false
      if (widgetIdRef.current && window.turnstile) {
        try {
          window.turnstile.remove(widgetIdRef.current)
        } catch {}
      }
    }
  }, [siteKey, resetKey])

  if (!siteKey) {
    return (
      <div className="p-3 border border-dashed border-neutral-300 bg-neutral-50 text-xs text-neutral-600 font-mono">
        <span className="font-semibold uppercase text-neutral-800">[Security Check]</span> Turnstile site key not configured in environment.
        {import.meta.env.DEV
          ? ' Local development bypass enabled.'
          : ' In production, bot verification via VITE_TURNSTILE_SITE_KEY is required.'}
      </div>
    )
  }

  return (
    <div className="py-2">
      <div ref={containerRef} className="min-h-[65px]" />
    </div>
  )
}
