import Link from 'next/link'
import { Lock, Zap, Package } from 'lucide-react'

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
  addonMode?: boolean
  moduleMode?: boolean
}) {
  const tierName = requiredTier === 'fleet' ? 'Fleet' : 'Pro'
  const featureName = feature || requiredFeature || 'This feature'
  const settingsHref = '/dashboard/settings/subscription'

  const icon = moduleMode
    ? <Package className="h-6 w-6 text-[var(--dash-amber)]" />
    : addonMode
    ? <Zap className="h-6 w-6 text-[var(--dash-amber)]" />
    : <Lock className="h-6 w-6 text-[var(--dash-amber)]" />

  const headline = moduleMode
    ? 'Add this module to your plan'
    : addonMode
    ? 'Add-on required'
    : `${tierName} plan required`

  const body = message
    ? message
    : moduleMode
    ? `${featureName} is available as a module. Add it to your plan in Subscription Settings.`
    : addonMode
    ? `${featureName} requires the AI Auto Lead add-on.`
    : `${featureName} is available on the ${tierName} plan.`

  const ctaLabel = moduleMode
    ? 'Add Module →'
    : addonMode
    ? 'Add Add-on →'
    : 'View Plans →'

  const ctaHref = moduleMode || addonMode ? settingsHref : '/pricing'

  return (
    <div className="relative w-full min-h-[480px] overflow-hidden">
      {/* Blurred placeholder content */}
      <div className="blur-sm pointer-events-none select-none opacity-40 p-6 space-y-4">
        {/* Fake stat row */}
        <div className="grid grid-cols-3 gap-px border border-[var(--dash-border)] bg-[var(--dash-border)]">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-[var(--dash-graphite)] p-5">
              <div className="h-2 w-16 bg-[var(--dash-border-bright)] rounded mb-3" />
              <div className="h-8 w-12 bg-[var(--dash-border-bright)] rounded" />
            </div>
          ))}
        </div>
        {/* Fake list rows */}
        <div className="space-y-px border border-[var(--dash-border)] bg-[var(--dash-border)]">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-[var(--dash-graphite)] px-4 py-4 flex items-center gap-3">
              <div className="w-0.5 h-10 bg-[var(--dash-border-bright)] rounded-sm" />
              <div className="flex-1 space-y-1.5">
                <div className="h-2.5 w-32 bg-[var(--dash-border-bright)] rounded" />
                <div className="h-2 w-48 bg-[var(--dash-border-bright)] rounded" />
              </div>
              <div className="h-6 w-16 bg-[var(--dash-border-bright)] rounded" />
            </div>
          ))}
        </div>
      </div>

      {/* Overlay */}
      <div className="absolute inset-0 flex items-center justify-center bg-[var(--dash-black)]/70 backdrop-blur-[2px]">
        <div className="border border-[var(--dash-border)] bg-[var(--dash-graphite)] w-full max-w-sm mx-4">
          {/* Header */}
          <div className="flex items-center gap-3 px-5 py-4 border-b border-[var(--dash-border)]">
            {icon}
            <div className="font-dash-condensed font-extrabold text-[17px] uppercase tracking-wide text-[var(--dash-text)]">
              {headline}
            </div>
          </div>

          {/* Body */}
          <div className="px-5 py-4 space-y-3">
            <div className="font-dash-condensed font-bold text-[15px] text-[var(--dash-amber)]">
              {featureName}
            </div>
            <div className="font-dash-mono text-[11px] text-[var(--dash-text-muted)] leading-relaxed">
              {body}
            </div>
          </div>

          {/* CTA */}
          <div className="px-5 pb-5">
            <Link
              href={ctaHref}
              className="flex items-center justify-center w-full py-3 bg-[var(--dash-amber)] text-[var(--dash-black)] font-dash-condensed font-extrabold text-[14px] uppercase tracking-wider hover:opacity-90 transition-opacity"
            >
              {ctaLabel}
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
