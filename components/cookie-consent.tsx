'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { X, Cookie } from 'lucide-react'
import Link from 'next/link'

export default function CookieConsent() {
  const [showBanner, setShowBanner] = useState(false)

  useEffect(() => {
    try {
      const consent = typeof window !== 'undefined' ? localStorage.getItem('cookie-consent') : null
      if (!consent) {
        setTimeout(() => setShowBanner(true), 500)
      }
    } catch {
      // localStorage can throw in private mode or restricted browsers
    }
  }, [])

  const handleAccept = () => {
    try {
      localStorage.setItem('cookie-consent', 'accepted')
    } catch { /* ignore */ }
    setShowBanner(false)
  }

  const handleDecline = () => {
    try {
      localStorage.setItem('cookie-consent', 'declined')
    } catch { /* ignore */ }
    setShowBanner(false)
  }

  if (!showBanner) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg shadow-lg p-4 md:p-6 flex flex-col md:flex-row items-start md:items-center gap-4">
          <div className="flex items-start gap-3 flex-1">
            <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center flex-shrink-0 mt-1">
              <Cookie className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-zinc-900 dark:text-white mb-1">
                We use cookies
              </h3>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                We use cookies to enhance your browsing experience, analyze site traffic, and personalize content. By clicking "Accept All", you consent to our use of cookies.{' '}
                <Link 
                  href="/privacy" 
                  className="underline hover:text-zinc-900 dark:hover:text-zinc-100"
                >
                  Learn more
                </Link>
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 w-full md:w-auto">
            <Button
              variant="outline"
              size="sm"
              onClick={handleDecline}
              className="flex-1 md:flex-none"
            >
              Decline
            </Button>
            <Button
              size="sm"
              onClick={handleAccept}
              className="flex-1 md:flex-none"
            >
              Accept All
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleDecline}
              className="hidden md:flex"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
