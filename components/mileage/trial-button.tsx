'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Sparkles, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

interface TrialButtonProps {
  businessId: string
}

export function TrialButton({ businessId }: TrialButtonProps) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleStartTrial = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/start-mileage-trial', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ businessId }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to start trial')
      }

      toast.success('14-day free trial started!')
      router.refresh()
    } catch (error: any) {
      console.error('Error starting trial:', error)
      toast.error(error.message || 'Failed to start trial')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-3">
      <Button
        onClick={handleStartTrial}
        disabled={loading}
        size="lg"
        className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
      >
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Starting Trial...
          </>
        ) : (
          <>
            <Sparkles className="h-4 w-4 mr-2" />
            Start 14-Day Free Trial
          </>
        )}
      </Button>
      <p className="text-sm text-zinc-500 dark:text-zinc-400">
        Try Mileage Tracker free for 14 days. No credit card required.
      </p>
    </div>
  )
}
