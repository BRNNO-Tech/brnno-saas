'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function DemoPage() {
  const router = useRouter()

  useEffect(() => {
    // Set demo mode cookie client-side
    function enableDemoMode() {
      // Set cookie with 24 hour expiration
      const expires = new Date()
      expires.setTime(expires.getTime() + 24 * 60 * 60 * 1000)
      document.cookie = `demo-mode=true; expires=${expires.toUTCString()}; path=/; SameSite=Lax`
      
      // Small delay to ensure cookie is set before redirect
      setTimeout(() => {
        router.push('/dashboard')
        router.refresh()
      }, 100)
    }
    enableDemoMode()
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-zinc-600 dark:text-zinc-400">Loading demo mode...</p>
      </div>
    </div>
  )
}
