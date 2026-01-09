'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { setDemoMode } from '@/lib/demo/utils'

export default function DemoPage() {
  const router = useRouter()

  useEffect(() => {
    // Set demo mode cookie
    async function enableDemoMode() {
      await setDemoMode(true)
      // Redirect to dashboard
      router.push('/dashboard')
      router.refresh()
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
