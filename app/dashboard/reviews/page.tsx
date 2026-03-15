export const dynamic = 'force-dynamic'

import { getReviewRequests, getReviewStats, getBusinessReviewSettings } from '@/lib/actions/reviews'
import ModernReviews from '@/components/reviews/modern-reviews'
import { canUseFullAutomation } from '@/lib/actions/permissions'
import UpgradePrompt from '@/components/upgrade-prompt'

export default async function ReviewsPage() {
  const canUseAutomation = await canUseFullAutomation()

  if (!canUseAutomation) {
    return (
      <div className="w-full pb-20 md:pb-0">
        <UpgradePrompt requiredTier="pro" feature="Review Automation" />
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
      <div className="w-full pb-20 md:pb-0">
        <div className="border border-[var(--dash-red)]/30 bg-[var(--dash-red)]/10 px-6 py-4">
          <div className="font-dash-condensed font-bold text-[var(--dash-red)]">Unable to load review data</div>
          <div className="font-dash-mono text-[11px] text-[var(--dash-text-muted)] mt-1">
            {error instanceof Error ? error.message : 'An error occurred while loading review data.'}
          </div>
        </div>
      </div>
    )
  }

  // Update stats with settings
  const finalStats = {
    ...stats,
    platform: settings.google_review_link || stats.platform,
    sentThisMonth: stats.sentThisMonth,
    showUsageLimit: stats.showUsageLimit,
    monthlyLimit: stats.monthlyLimit,
  }

  // For now, we don't have actual reviews stored, so use empty array
  const recentReviews: any[] = []

  return (
    <div className="w-full pb-20 md:pb-0">
      <ModernReviews
        requests={requests}
        stats={finalStats}
        recentReviews={recentReviews}
      />
    </div>
  )
}
