'use client'

import { useEffect, useState } from 'react'

export default function DemoPage() {
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let timeoutId: NodeJS.Timeout

    async function enableDemoMode() {
      try {
        // Set cookie with 24 hour expiration
        const expires = new Date()
        expires.setTime(expires.getTime() + 24 * 60 * 60 * 1000)
        document.cookie = `demo-mode=true; expires=${expires.toUTCString()}; path=/; SameSite=Lax`
        
        // Wait a moment to ensure cookie is set
        await new Promise(resolve => setTimeout(resolve, 300))
        
        // Verify cookie was set
        const cookies = document.cookie.split(';')
        const demoCookie = cookies.find(c => c.trim().startsWith('demo-mode='))
        
        if (!demoCookie?.includes('true')) {
          setError('Failed to set demo mode cookie. Please try again.')
          setLoading(false)
          return
        }
        
        // Use window.location for more reliable redirect
        // This ensures the page fully reloads with the cookie set
        window.location.href = '/dashboard'
        
        // Fallback: if redirect doesn't happen within 2 seconds, show error
        timeoutId = setTimeout(() => {
          setError('Redirect is taking longer than expected. Please try clicking the button below.')
          setLoading(false)
        }, 2000)
      } catch (err) {
        console.error('Error enabling demo mode:', err)
        setError('Failed to enable demo mode. Please try again.')
        setLoading(false)
      }
    }
    
    enableDemoMode()

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId)
      }
    }
  }, [])

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950">
        <div className="text-center max-w-md mx-auto p-6">
          <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
          <div className="space-y-2">
            <button
              onClick={() => {
                // Try setting cookie again and redirect
                const expires = new Date()
                expires.setTime(expires.getTime() + 24 * 60 * 60 * 1000)
                document.cookie = `demo-mode=true; expires=${expires.toUTCString()}; path=/; SameSite=Lax`
                setTimeout(() => {
                  window.location.href = '/dashboard'
                }, 100)
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 mr-2"
            >
              Retry
            </button>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
            >
              Reload Page
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-zinc-600 dark:text-zinc-400">Loading demo mode...</p>
        </div>
      </div>
    )
  }

  return null
}
