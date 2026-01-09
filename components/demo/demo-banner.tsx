'use client'

import { useEffect, useState } from 'react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Info, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default function DemoBanner() {
  const [isDemoMode, setIsDemoMode] = useState(false)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    // Check if demo mode cookie exists
    const checkDemoMode = () => {
      const cookies = document.cookie.split(';')
      const demoCookie = cookies.find(c => c.trim().startsWith('demo-mode='))
      setIsDemoMode(demoCookie?.includes('true') || false)
    }
    
    checkDemoMode()
    
    // Check if banner was dismissed
    const dismissedState = localStorage.getItem('demo-banner-dismissed')
    if (dismissedState === 'true') {
      setDismissed(true)
    }
  }, [])

  if (!isDemoMode || dismissed) {
    return null
  }

  const handleDismiss = () => {
    setDismissed(true)
    localStorage.setItem('demo-banner-dismissed', 'true')
  }

  return (
    <Alert className="mb-4 border-blue-500 bg-blue-50 dark:bg-blue-950/20 border-l-4">
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3 flex-1">
          <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
          <div className="flex-1">
            <AlertDescription className="text-blue-900 dark:text-blue-100">
              <strong className="font-semibold">Demo Mode Active</strong>
              <p className="mt-1 text-sm">
                You're viewing the app with sample data. All features are available for demonstration purposes.
                <Link href="/login" className="ml-2 underline font-medium">
                  Sign in to access your real account
                </Link>
              </p>
            </AlertDescription>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/30"
          onClick={handleDismiss}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </Alert>
  )
}
