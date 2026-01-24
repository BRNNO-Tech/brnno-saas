export const dynamic = 'force-dynamic'

import { getReviewRequests, getReviewStats, getBusinessReviewSettings } from '@/lib/actions/reviews'
import ModernReviews from '@/components/reviews/modern-reviews'
import { canUseFullAutomation } from '@/lib/actions/permissions'
import UpgradePrompt from '@/components/upgrade-prompt'
import { GlowBG } from '@/components/ui/glow-bg'

export default async function ReviewsPage() {
  const canUseAutomation = await canUseFullAutomation()
  
  if (!canUseAutomation) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-zinc-50 via-white to-zinc-100 dark:from-[#07070A] dark:via-[#07070A] dark:to-[#0a0a0d] text-zinc-900 dark:text-white -m-4 sm:-m-6">
        <div className="relative">
          <div className="hidden dark:block">
            <GlowBG />
          </div>
          <div className="relative mx-auto max-w-[1280px] px-6 py-8">
            <UpgradePrompt requiredTier="pro" feature="Review Automation" />
          </div>
        </div>
      </div>
    )
  }
  
  let requests
  let stats
  let settings
  
  try {
    requests = await getReviewRequests()
    stats = await getReviewStats()
    settings = await getBusinessReviewSettings()
  } catch (error) {
    console.error('Error loading review data:', error)
    return (
      <div className="min-h-screen bg-gradient-to-br from-zinc-50 via-white to-zinc-100 dark:from-[#07070A] dark:via-[#07070A] dark:to-[#0a0a0d] text-zinc-900 dark:text-white -m-4 sm:-m-6">
        <div className="relative">
          <div className="hidden dark:block">
            <GlowBG />
          </div>
          <div className="relative mx-auto max-w-[1280px] px-6 py-8">
            <div className="rounded-2xl border border-red-500/30 dark:border-red-500/30 bg-red-500/10 dark:bg-red-500/15 backdrop-blur-sm p-6 shadow-lg">
              <h2 className="text-lg font-semibold text-red-800 dark:text-red-400">
                Unable to load review data
              </h2>
              <p className="mt-2 text-sm text-red-600 dark:text-red-300">
                {error instanceof Error ? error.message : 'An error occurred while loading review data.'}
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Update stats with settings
  const finalStats = {
    ...stats,
    platform: settings.google_review_link || stats.platform,
  }

  // For now, we don't have actual reviews stored, so use empty array
  // In the future, you could integrate with Google Reviews API or store reviews
  const recentReviews: any[] = []
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-50 via-white to-zinc-100 dark:from-[#07070A] dark:via-[#07070A] dark:to-[#0a0a0d] text-zinc-900 dark:text-white -m-4 sm:-m-6">
      <div className="relative">
        <div className="hidden dark:block">
          <GlowBG />
        </div>
        <div className="relative mx-auto max-w-[1280px] px-6 py-8">
          <ModernReviews
            requests={requests}
            stats={finalStats}
            recentReviews={recentReviews}
          />
        </div>
      </div>
    </div>
  )
}

