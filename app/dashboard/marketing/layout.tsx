'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ')
}

const tabs = [
  { label: 'Campaigns', href: '/dashboard/marketing/campaigns' },
  { label: 'Promo Codes', href: '/dashboard/marketing/promo-codes' },
  { label: 'Caption Generator', href: '/dashboard/marketing/caption-generator' },
  { label: 'Integrations', href: '/dashboard/marketing/integrations' },
  { label: 'Analytics', href: '/dashboard/marketing/analytics' },
]

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  return (
    <div className="w-full min-h-0">
      <nav
        className="flex flex-wrap gap-px border-b border-[var(--dash-border)] bg-[var(--dash-border)] mb-6 overflow-x-auto"
        aria-label="Marketing sections"
      >
        {tabs.map((tab) => {
          const isActive =
            pathname === tab.href || (pathname?.startsWith(`${tab.href}/`) ?? false)
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                'px-4 py-2.5 font-dash-condensed font-bold text-[13px] uppercase tracking-wider whitespace-nowrap',
                'bg-[var(--dash-surface)] text-[var(--dash-text-muted)]',
                isActive && 'bg-[var(--dash-graphite)] text-[var(--dash-amber)]'
              )}
            >
              {tab.label}
            </Link>
          )
        })}
      </nav>
      {children}
    </div>
  )
}
