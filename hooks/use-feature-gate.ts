'use client'

import { useCallback, useEffect, useState } from 'react'
import { getCurrentTier } from '@/lib/actions/permissions'
import { hasFeature, type Tier } from '@/lib/permissions'

const POLL_INTERVAL_MS = 5 * 60 * 1000 // 5 minutes

export function useFeatureGate() {
  const [tier, setTier] = useState<Tier>(null)
  const [loading, setLoading] = useState(true)

  const refetchTier = useCallback(async () => {
    try {
      const currentTier = await getCurrentTier()
      setTier(currentTier)
    } catch (error) {
      console.error('Error loading tier:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  // Initial fetch
  useEffect(() => {
    refetchTier()
  }, [refetchTier])

  // Refetch on window focus (e.g. user switches back from admin panel or Stripe)
  useEffect(() => {
    const handleFocus = () => {
      refetchTier()
    }
    window.addEventListener('focus', handleFocus)
    return () => window.removeEventListener('focus', handleFocus)
  }, [refetchTier])

  // Poll every 5 minutes as backup (expiry, webhook updates, etc.)
  useEffect(() => {
    const interval = setInterval(() => {
      refetchTier()
    }, POLL_INTERVAL_MS)
    return () => clearInterval(interval)
  }, [refetchTier])

  const can = useCallback(
    (feature: string) => hasFeature(tier, feature),
    [tier]
  )

  return { tier, loading, can, refetchTier }
}
