'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Briefcase, Target, Receipt, Settings } from 'lucide-react'

const TABS = [
  { name: 'Home', href: '/dashboard', icon: LayoutDashboard, exact: true },
  { name: 'Jobs', href: '/dashboard/jobs', icon: Briefcase, exact: false },
  { name: 'Leads', href: '/dashboard/leads', icon: Target, exact: false },
  { name: 'Invoices', href: '/dashboard/invoices', icon: Receipt, exact: false },
  { name: 'Settings', href: '/dashboard/settings', icon: Settings, exact: false },
]

export default function MobileBottomNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden border-t border-[var(--dash-border)] bg-[var(--dash-graphite)]">
      <div className="flex items-stretch h-16">
        {TABS.map((tab) => {
          const Icon = tab.icon
          const isActive = tab.exact
            ? pathname === tab.href
            : pathname?.startsWith(tab.href)

          return (
            <Link
              key={tab.href}
              href={tab.href}
              className="flex-1 flex flex-col items-center justify-center gap-1 relative transition-colors"
              style={{
                color: isActive ? 'var(--dash-amber)' : 'var(--dash-text)',
                background: isActive ? 'var(--dash-amber-glow)' : 'transparent',
              }}
            >
              {isActive && (
                <span
                  className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-b"
                  style={{ background: 'var(--dash-amber)' }}
                />
              )}
              <Icon className="h-5 w-5" />
              <span
                className="font-dash-mono text-[9px] uppercase tracking-wider"
                style={{ color: isActive ? 'var(--dash-amber)' : 'var(--dash-text)' }}
              >
                {tab.name}
              </span>
            </Link>
          )
        })}
      </div>
      {/* Safe area spacer for iPhone home indicator */}
      <div style={{ height: 'env(safe-area-inset-bottom)' }} />
    </nav>
  )
}
