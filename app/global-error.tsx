'use client'

import { useEffect } from 'react'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Global error:', error.digest ?? error.message, error)
  }, [error])

  return (
    <html lang="en">
      <body style={{ margin: 0, fontFamily: 'system-ui, sans-serif', background: '#fff', color: '#18181b' }}>
        <div
          style={{
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 24,
          }}
        >
          <div
            style={{
              maxWidth: 400,
              width: '100%',
              padding: 32,
              borderRadius: 12,
              border: '1px solid #e4e4e7',
              background: '#fafafa',
            }}
          >
            <h1 style={{ fontSize: 20, fontWeight: 600, margin: 0 }}>
              Something went wrong
            </h1>
            <p style={{ fontSize: 14, color: '#71717a', marginTop: 12 }}>
              A critical error occurred. Please try again or go to the home page.
            </p>
            {error.digest && (
              <p style={{ fontSize: 12, color: '#a1a1aa', marginTop: 8 }}>
                Error ID: {error.digest}
              </p>
            )}
            <div style={{ marginTop: 24, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={() => reset()}
                style={{
                  padding: '10px 16px',
                  borderRadius: 8,
                  border: '1px solid #e4e4e7',
                  background: '#fff',
                  cursor: 'pointer',
                  fontSize: 14,
                }}
              >
                Try again
              </button>
              <a
                href="/"
                style={{
                  padding: '10px 16px',
                  borderRadius: 8,
                  background: '#18181b',
                  color: '#fff',
                  textDecoration: 'none',
                  fontSize: 14,
                }}
              >
                Go to home
              </a>
            </div>
          </div>
        </div>
      </body>
    </html>
  )
}
