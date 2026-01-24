'use client'

import { useEffect, useState } from 'react'
import { getCurrentTier } from '@/lib/actions/permissions'
import { hasFeature, type Tier } from '@/lib/permissions'

export function useFeatureGate() {
  const [tier, setTier] = useState<Tier>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadTier() {
      try {
        const currentTier = await getCurrentTier()
        setTier(currentTier)
      } catch (error) {
        console.error('Error loading tier:', error)
      } finally {
        setLoading(false)
      }
    }
    loadTier()
  }, [])

  return {
    can: (feature: string) => hasFeature(tier, feature),
    tier,
    loading,
  }
}
