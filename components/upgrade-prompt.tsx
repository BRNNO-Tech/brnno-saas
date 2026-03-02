import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Lock } from 'lucide-react'

export default function UpgradePrompt({
  requiredTier,
  feature,
  requiredFeature,
  message,
  addonMode,
  moduleMode,
}: {
  requiredTier?: 'pro' | 'fleet'
  feature?: string
  requiredFeature?: string
  message?: string
  /** When true, prompt is for a subscription add-on (links to Add-ons page) */
  addonMode?: boolean
  /** When true, prompt is for a module (links to subscription settings to enable module) */
  moduleMode?: boolean
}) {
  const tierName = requiredTier === 'pro' ? 'Pro' : requiredTier === 'fleet' ? 'Fleet' : 'Pro'
  const featureName = feature || requiredFeature || 'This feature'
  const settingsHref = '/dashboard/settings/subscription'

  return (
    <Card className="max-w-2xl mx-auto mt-8">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Lock className="h-5 w-5 text-yellow-600 dark:text-yellow-500" />
          <CardTitle className="text-zinc-900 dark:text-white">Upgrade Required</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        {message ? (
          <p className="text-zinc-600 dark:text-zinc-400 mb-4">
            {message}
          </p>
        ) : addonMode ? (
          <p className="text-zinc-600 dark:text-zinc-400 mb-4">
            <strong className="text-zinc-900 dark:text-white">{featureName}</strong> requires the <strong className="text-zinc-900 dark:text-white">AI Auto Lead</strong> add-on.
          </p>
        ) : moduleMode ? (
          <p className="text-zinc-600 dark:text-zinc-400 mb-4">
            <strong className="text-zinc-900 dark:text-white">{featureName}</strong> is available as a module. Enable it in Settings → Subscription.
          </p>
        ) : (
          <p className="text-zinc-600 dark:text-zinc-400 mb-4">
            <strong className="text-zinc-900 dark:text-white">{featureName}</strong> is available on the <strong className="text-zinc-900 dark:text-white">{tierName}</strong> plan.
          </p>
        )}
        <p className="text-sm text-zinc-500 dark:text-zinc-500 mb-6">
          {addonMode ? 'Add the add-on to unlock AI-powered auto follow-up sequences.' : moduleMode ? 'Enable this module in your subscription settings.' : 'Upgrade your plan to unlock this feature and more.'}
        </p>
        <Link href={addonMode || moduleMode ? settingsHref : '/pricing'}>
          <Button>
            {addonMode ? 'Add add-on' : moduleMode ? 'Enable module' : 'View Plans & Upgrade'}
          </Button>
        </Link>
      </CardContent>
    </Card>
  )
}
