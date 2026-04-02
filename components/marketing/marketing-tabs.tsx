'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useMemo, useState } from 'react'
import MarketingUpgradeModal from '@/components/marketing/marketing-upgrade-modal'

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ')
}

type Tab = { label: string; href: string; gated: boolean }

export default function MarketingTabs({ hasMarketing }: { hasMarketing: boolean }) {
  const pathname = usePathname()
  const [upgradeOpen, setUpgradeOpen] = useState(false)

  const tabs: Tab[] = useMemo(
    () => [
      { label: 'Promo Codes', href: '/dashboard/marketing/promo-codes', gated: false },
      { label: 'Campaigns', href: '/dashboard/marketing/campaigns', gated: true },
      { label: 'Caption Generator', href: '/dashboard/marketing/caption-generator', gated: true },
      { label: 'Integrations', href: '/dashboard/marketing/integrations', gated: true },
      { label: 'Analytics', href: '/dashboard/marketing/analytics', gated: true },
    ],
    []
  )

  return (
    <>
      <nav
        className="flex flex-wrap gap-px border-b border-[var(--dash-border)] bg-[var(--dash-border)] mb-6 overflow-x-auto"
        aria-label="Marketing sections"
      >
        {tabs.map((tab) => {
          const locked = tab.gated && !hasMarketing
          const isActive =
            pathname === tab.href || (pathname?.startsWith(`${tab.href}/`) ?? false)

          const base =
            'px-4 py-2.5 font-dash-condensed font-bold text-[13px] uppercase tracking-wider whitespace-nowrap'
          const common = cn(
            base,
            'bg-[var(--dash-surface)] text-[var(--dash-text-muted)]',
            isActive && 'bg-[var(--dash-graphite)] text-[var(--dash-amber)]'
          )

          if (locked) {
            return (
              <div
                key={tab.href}
                role="button"
                tabIndex={0}
                onClick={() => setUpgradeOpen(true)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') setUpgradeOpen(true)
                }}
                className={cn(
                  common,
                  'opacity-60 cursor-pointer select-none hover:opacity-90',
                  'flex items-center gap-2'
                )}
                aria-label={`${tab.label} (locked)`}
              >
                <span>🔒</span>
                <span>{tab.label}</span>
              </div>
            )
          }

          return (
            <Link key={tab.href} href={tab.href} className={common}>
              {tab.label}
            </Link>
          )
        })}
      </nav>

      <MarketingUpgradeModal open={upgradeOpen} onOpenChange={setUpgradeOpen} />
    </>
  )
}

