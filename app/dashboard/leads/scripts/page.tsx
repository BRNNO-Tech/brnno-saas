export const dynamic = 'force-dynamic'

import { canUseLeadRecoveryDashboard } from '@/lib/actions/permissions'
import { getScripts } from '@/lib/actions/scripts'
import UpgradePrompt from '@/components/upgrade-prompt'
import { GlowBG } from '@/components/ui/glow-bg'
import { ScriptsLibraryLayout } from '@/components/scripts/scripts-library-layout'

export default async function ScriptsPage() {
  const canUseDashboard = await canUseLeadRecoveryDashboard()

  if (!canUseDashboard) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-zinc-50 via-white to-zinc-100 dark:from-[#07070A] dark:via-[#07070A] dark:to-[#0a0a0d] text-zinc-900 dark:text-white -m-4 sm:-m-6">
        <div className="relative">
          <div className="hidden dark:block">
            <GlowBG />
          </div>
          <div className="relative mx-auto max-w-[1280px] px-6 py-8">
            <UpgradePrompt requiredTier="pro" feature="Scripts Library" />
          </div>
        </div>
      </div>
    )
  }

  const scripts = await getScripts()

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-50 via-white to-zinc-100 dark:from-[#07070A] dark:via-[#07070A] dark:to-[#0a0a0d] text-zinc-900 dark:text-white -m-4 sm:-m-6">
      <div className="relative">
        <div className="hidden dark:block">
          <GlowBG />
        </div>
        <div className="relative mx-auto max-w-[1280px] px-6 py-8">
          <div className="mb-6">
            <h1 className="text-3xl font-semibold tracking-tight text-zinc-900 dark:text-white">
              Scripts Library
            </h1>
            <p className="mt-1 text-sm text-zinc-600 dark:text-white/55">
              Template library for lead recovery messages with performance tracking
            </p>
          </div>

          <ScriptsLibraryLayout initialScripts={scripts} />
        </div>
      </div>
    </div>
  )
}
