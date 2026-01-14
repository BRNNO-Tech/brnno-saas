export const dynamic = 'force-dynamic'

import { canUseLeadRecoveryDashboard } from '@/lib/actions/permissions'
import UpgradePrompt from '@/components/upgrade-prompt'
import { GlowBG } from '@/components/ui/glow-bg'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'

export default async function ReportsPage() {
  const canUseDashboard = await canUseLeadRecoveryDashboard()

  if (!canUseDashboard) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-zinc-50 via-white to-zinc-100 dark:from-[#07070A] dark:via-[#07070A] dark:to-[#0a0a0d] text-zinc-900 dark:text-white -m-4 sm:-m-6">
        <div className="relative">
          <div className="hidden dark:block">
            <GlowBG />
          </div>
          <div className="relative mx-auto max-w-[1280px] px-6 py-8">
            <UpgradePrompt requiredTier="pro" feature="Lead Recovery Reports" />
          </div>
        </div>
      </div>
    )
  }

  // For now, redirect to analytics page which has similar functionality
  // In Phase 6, we'll build out the full Reports page per the plan
  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-50 via-white to-zinc-100 dark:from-[#07070A] dark:via-[#07070A] dark:to-[#0a0a0d] text-zinc-900 dark:text-white -m-4 sm:-m-6">
      <div className="relative">
        <div className="hidden dark:block">
          <GlowBG />
        </div>
        <div className="relative mx-auto max-w-[1280px] px-6 py-8">
          <div className="flex items-center gap-4 mb-6">
            <Link href="/dashboard/leads">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-semibold tracking-tight text-zinc-900 dark:text-white">
                Reports
              </h1>
              <p className="mt-1 text-sm text-zinc-600 dark:text-white/55">
                ROI & Analytics - Full Reports page coming in Phase 6
              </p>
            </div>
          </div>
          <div className="rounded-2xl border border-zinc-200/50 dark:border-white/10 bg-white/80 dark:bg-white/5 backdrop-blur-sm p-6">
            <p className="text-sm text-zinc-600 dark:text-white/55 mb-4">
              For now, view detailed analytics at:
            </p>
            <Link href="/dashboard/leads/analytics">
              <Button>View Analytics</Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
