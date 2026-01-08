import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Lock } from 'lucide-react'

export default function UpgradePrompt({ 
  requiredTier, 
  feature 
}: { 
  requiredTier: 'pro' | 'fleet'
  feature: string 
}) {
  const tierName = requiredTier === 'pro' ? 'Pro' : 'Fleet'
  
  return (
    <Card className="max-w-2xl mx-auto mt-8">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Lock className="h-5 w-5 text-yellow-600 dark:text-yellow-500" />
          <CardTitle className="text-zinc-900 dark:text-white">Upgrade Required</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-zinc-600 dark:text-zinc-400 mb-4">
          <strong className="text-zinc-900 dark:text-white">{feature}</strong> is available on the <strong className="text-zinc-900 dark:text-white">{tierName}</strong> plan.
        </p>
        <p className="text-sm text-zinc-500 dark:text-zinc-500 mb-6">
          Upgrade your plan to unlock this feature and more.
        </p>
        <Link href="/pricing">
          <Button>
            View Plans & Upgrade
          </Button>
        </Link>
      </CardContent>
    </Card>
  )
}
