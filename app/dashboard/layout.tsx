'use client'

import Link from "next/link";
import React, { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { signOut } from "@/lib/actions/auth";
import { getBusiness } from "@/lib/actions/business";
import { useFeatureGate } from "@/hooks/use-feature-gate";
import { getUnreadLeadsCount } from "@/lib/actions/leads";
import { hasSubscriptionAddon } from "@/lib/actions/subscription-addons";

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}
import {
  LayoutDashboard,
  Users,
  Target,
  Wrench,
  Calendar,
  CalendarDays,
  FileText,
  Receipt,
  BarChart,
  Star,
  Settings,
  LogOut,
  Menu,
  X,
  MessageSquare,
  Briefcase,
  UsersRound,
  ChevronDown,
  ChevronRight,
  Package,
  Sparkles,
  LayoutGrid,
  BarChart3,
  Inbox,
  PlayCircle,
  FileCode,
  Search,
  Plus,
  Bell,
  Calendar as CalendarIcon,
  Navigation,
} from "lucide-react";
import { SearchModal } from "@/components/leads/search-modal";
import { DateRangePicker } from "@/components/leads/date-range-picker";
import { NotificationsDropdown } from "@/components/leads/notifications-dropdown";
import { AddLeadDialog } from "@/components/leads/add-lead-dialog";

type NavigationItem = {
  name: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  requiredFeature?: string
  requiredTier?: 'pro' | 'fleet'
  badge?: string
}

type NavigationGroup = {
  name: string
  type: "group"
  items: NavigationItem[]
}

type NavigationEntry = NavigationItem | NavigationGroup

const navigation: NavigationEntry[] = [
  {
    name: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  } as NavigationItem,
  {
    name: "LEAD RECOVERY",
    type: "group",
    items: [
      { name: "Recovery Command Center", href: "/dashboard/leads", icon: Target, requiredFeature: "limited_lead_recovery" },
      { name: "Leads Inbox", href: "/dashboard/leads/inbox", icon: Inbox, requiredFeature: "lead_recovery_dashboard", requiredTier: "pro" },
      { name: "Auto Follow-Up", href: "/dashboard/leads/sequences", icon: PlayCircle, requiredFeature: "lead_recovery_dashboard", requiredTier: "pro" },
    ],
  },
  {
    name: "CUSTOMERS",
    type: "group",
    items: [
      { name: "Customers", href: "/dashboard/customers", icon: Users },
      { name: "Jobs", href: "/dashboard/jobs", icon: Briefcase },
      { name: "Quick Quote", href: "/dashboard/quick-quote", icon: Sparkles, badge: "New" },
      { name: "Messages", href: "/dashboard/messages", icon: MessageSquare },
    ],
  },
  {
    name: "BUSINESS",
    type: "group",
    items: [
      { name: "Services", href: "/dashboard/services", icon: Wrench },
      { name: "Team", href: "/dashboard/team", icon: UsersRound, requiredFeature: "team_management", requiredTier: "pro" },
      { name: "Inventory", href: "/dashboard/inventory", icon: Package },
      { name: "Mileage", href: "/dashboard/mileage", icon: Navigation, badge: "Beta" },
      { name: "Calendar", href: "/dashboard/schedule", icon: CalendarDays },
      // { name: "Reviews", href: "/dashboard/reviews", icon: Star, requiredFeature: "full_automation", requiredTier: "pro" },
    ],
  },
];

function Sidebar({
  isCollapsed,
  toggleSidebar,
  isMobile = false,
  onMobileClose
}: {
  isCollapsed: boolean
  toggleSidebar: () => void
  isMobile?: boolean
  onMobileClose?: () => void
}) {
  const pathname = usePathname()
  // Default to expanded for LEAD RECOVERY group so it's visible
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({
    'LEAD RECOVERY': false, // false = expanded
  })
  const [businessName, setBusinessName] = useState<string>('Business')
  const [unreadCount, setUnreadCount] = useState<number>(0)
  const [hasAIAutoLeadAddon, setHasAIAutoLeadAddon] = useState<boolean>(false)
  const { can, tier } = useFeatureGate()

  useEffect(() => {
    async function loadBusiness() {
      try {
        const business = await getBusiness()
        if (business?.name) {
          setBusinessName(business.name)
        }
      } catch (error) {
        console.error('Error loading business:', error)
      }
    }
    loadBusiness()
  }, [])

  useEffect(() => {
    if (!can('lead_recovery_dashboard')) return
    let isMounted = true
    hasSubscriptionAddon('ai_auto_lead')
      .then((has) => { if (isMounted) setHasAIAutoLeadAddon(has) })
      .catch(() => { if (isMounted) setHasAIAutoLeadAddon(false) })
    return () => { isMounted = false }
  }, [tier])

  useEffect(() => {
    // Check access inside effect to avoid dependency issues
    if (!can('lead_recovery_dashboard')) {
      setUnreadCount(0)
      return
    }

    let isMounted = true

    async function loadUnreadCount() {
      try {
        const count = await getUnreadLeadsCount()
        // Only update if component is still mounted
        if (isMounted) {
          setUnreadCount(count)
        }
      } catch (error) {
        console.error('Error loading unread count:', error)
      }
    }

    // Initial load
    loadUnreadCount()

    // Refresh count every 30 seconds (optimized: only when tab is visible)
    const interval = setInterval(() => {
      // Only refresh if tab is visible (saves resources when tab is in background)
      if (document.visibilityState === 'visible') {
        loadUnreadCount()
      }
    }, 30000)

    // Also refresh when tab becomes visible again
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        loadUnreadCount()
      }
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      isMounted = false
      clearInterval(interval)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // Removed pathname dependency - no need to refetch on route change

  async function handleLogout() {
    // Use server action for proper cookie handling
    await signOut()
  }

  const handleLinkClick = () => {
    if (isMobile && onMobileClose) {
      onMobileClose()
    }
  }

  function toggleGroup(groupName: string) {
    setCollapsedGroups(prev => ({ ...prev, [groupName]: !prev[groupName] }))
  }

  return (
    <div className={`flex h-full flex-col border-r border-zinc-200/50 dark:border-white/10 bg-white/80 dark:bg-black/35 backdrop-blur-xl transition-all duration-300 ${isCollapsed && !isMobile ? 'w-16' : 'w-[280px]'}`}>
      {/* Logo / Business Name */}
      <div className="flex h-16 items-center justify-between border-b border-zinc-200/50 dark:border-white/10 px-5 py-5">
        {(!isCollapsed || isMobile) && (
          <div className="flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-violet-500/40 to-cyan-500/20 ring-1 ring-zinc-200/50 dark:ring-white/10">
              <Sparkles className="h-5 w-5 text-zinc-700 dark:text-white" />
            </div>
            <div>
              <p className="text-xs text-zinc-500 dark:text-white/45">BRNNO</p>
              <p className="text-sm font-semibold text-zinc-900 dark:text-white">{businessName}</p>
            </div>
          </div>
        )}
        {isMobile ? (
          <button
            onClick={onMobileClose}
            className="grid h-10 w-10 place-items-center rounded-2xl border border-zinc-200/50 dark:border-white/10 bg-white/50 dark:bg-white/5 text-zinc-600 dark:text-white/70 hover:bg-zinc-100 dark:hover:bg-white/10 transition-colors"
            aria-label="Close menu"
          >
            <X className="h-4 w-4" />
          </button>
        ) : (
          <button
            onClick={toggleSidebar}
            className="grid h-10 w-10 place-items-center rounded-2xl border border-zinc-200/50 dark:border-white/10 bg-white/50 dark:bg-white/5 text-zinc-600 dark:text-white/70 hover:bg-zinc-100 dark:hover:bg-white/10 transition-colors"
            aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            <LayoutGrid className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-4 pb-6">
        {navigation.map((item) => {
          // Single item (Dashboard)
          if (!('type' in item)) {
            const navItem = item as NavigationItem
            const Icon = navItem.icon as React.ComponentType<{ className?: string }>
            const isActive = pathname === navItem.href

            if (!Icon) return null

            return (
              <Link
                key={navItem.name}
                href={navItem.href}
                onClick={handleLinkClick}
                className={cn(
                  "group flex w-full items-center justify-between rounded-xl px-3 py-2 text-sm transition",
                  "hover:bg-zinc-100/50 dark:hover:bg-white/5",
                  isActive &&
                  "bg-gradient-to-r from-violet-500/15 to-transparent ring-1 ring-violet-500/25"
                )}
                title={isCollapsed && !isMobile ? navItem.name : undefined}
              >
                <span className="flex items-center gap-3">
                  <span
                    className={cn(
                      "grid h-9 w-9 place-items-center rounded-xl border border-zinc-200/50 dark:border-white/10 bg-zinc-50/50 dark:bg-white/5",
                      isActive &&
                      "border-violet-500/25 dark:border-violet-500/25 bg-violet-500/10 dark:bg-violet-500/10 shadow-[0_0_0_1px_rgba(139,92,246,0.2)]"
                    )}
                  >
                    <Icon className={cn("h-4 w-4 text-zinc-700 dark:text-white/70", isActive && "text-violet-600 dark:text-violet-300")} />
                  </span>
                  {(!isCollapsed || isMobile) && (
                    <span className={cn("text-zinc-700 dark:text-white/75", isActive && "text-zinc-900 dark:text-white")}>{navItem.name}</span>
                  )}
                </span>
              </Link>
            )
          }

          // Group
          const navGroup = item as NavigationGroup
          if (isCollapsed && !isMobile) {
            // When collapsed, show only group icon (first item's icon)
            const FirstIcon = navGroup.items?.[0]?.icon as React.ComponentType<{ className?: string }> | undefined
            return FirstIcon ? (
              <div key={navGroup.name} className="py-2">
                <div className="h-8 w-8 mx-auto rounded-xl border border-zinc-200/50 dark:border-white/10 bg-zinc-50/50 dark:bg-white/5 flex items-center justify-center">
                  <FirstIcon className="h-4 w-4 text-zinc-600 dark:text-white/70" />
                </div>
              </div>
            ) : null
          }

          const isGroupCollapsed = collapsedGroups[navGroup.name]

          return (
            <div key={navGroup.name} className="mt-6">
              {/* Group Header */}
              <button
                onClick={() => toggleGroup(navGroup.name)}
                className="mb-2 flex w-full items-center justify-between rounded-xl px-2 py-2 text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-white/35 hover:bg-zinc-100/50 dark:hover:bg-white/5 transition-colors"
              >
                <span className="flex items-center gap-2">
                  {navGroup.name === 'SALES' && <BarChart3 className="h-4 w-4" />}
                  {navGroup.name === 'LEAD RECOVERY' && <Target className="h-4 w-4" />}
                  {navGroup.name === 'CUSTOMERS' && <Users className="h-4 w-4" />}
                  {navGroup.name === 'FINANCE' && <Receipt className="h-4 w-4" />}
                  {navGroup.name === 'BUSINESS' && <Wrench className="h-4 w-4" />}
                  {navGroup.name}
                </span>
                {!isMobile && (
                  isGroupCollapsed ? (
                    <ChevronRight className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )
                )}
              </button>

              {/* Group Items */}
              {!isGroupCollapsed && (
                <div className="space-y-1">
                  {navGroup.items?.map((subItem: NavigationItem) => {
                    const Icon = subItem.icon as React.ComponentType<{ className?: string }> | undefined
                    const isActive = pathname === subItem.href || (subItem.href !== '/dashboard' && pathname?.startsWith(subItem.href))

                    // Check if user has access to this item
                    const hasFeatureAccess = subItem.requiredFeature ? can(subItem.requiredFeature) : true
                    const hasTierAccess = subItem.requiredTier
                      ? (subItem.requiredTier === 'pro' && (tier === 'pro' || tier === 'fleet')) ||
                      (subItem.requiredTier === 'fleet' && tier === 'fleet')
                      : true
                    const hasAccess = hasFeatureAccess && hasTierAccess

                    if (!Icon) return null

                    return (
                      <Link
                        key={subItem.name}
                        href={subItem.href}
                        onClick={handleLinkClick}
                        className={cn(
                          "group flex w-full items-center justify-between rounded-xl px-3 py-2 text-sm transition",
                          "hover:bg-zinc-100/50 dark:hover:bg-white/5",
                          isActive &&
                          "bg-gradient-to-r from-violet-500/15 to-transparent ring-1 ring-violet-500/25",
                          !hasAccess && "opacity-60"
                        )}
                      >
                        <span className="flex items-center gap-3">
                          <span
                            className={cn(
                              "grid h-9 w-9 place-items-center rounded-xl border border-zinc-200/50 dark:border-white/10 bg-zinc-50/50 dark:bg-white/5",
                              isActive &&
                              "border-violet-500/25 dark:border-violet-500/25 bg-violet-500/10 dark:bg-violet-500/10 shadow-[0_0_0_1px_rgba(139,92,246,0.2)]",
                              !hasAccess && "opacity-50"
                            )}
                          >
                            <Icon className={cn("h-4 w-4 text-zinc-700 dark:text-white/70", isActive && "text-violet-600 dark:text-violet-300")} />
                          </span>
                          <span className={cn("text-zinc-700 dark:text-white/75", isActive && "text-zinc-900 dark:text-white")}>
                            {subItem.href === '/dashboard/leads/sequences' && hasAIAutoLeadAddon ? 'AI Auto Follow-Up' : subItem.name}
                          </span>
                        </span>
                        <span className="flex items-center gap-2">
                          {/* Show unread count badge for Leads Inbox */}
                          {subItem.href === '/dashboard/leads/inbox' && unreadCount > 0 && (
                            <span className="rounded-full bg-violet-500 text-white px-2 py-0.5 text-xs font-semibold min-w-[20px] text-center">
                              {unreadCount > 99 ? '99+' : unreadCount}
                            </span>
                          )}
                          {subItem.badge && (
                            <span className="rounded-full bg-amber-500/15 dark:bg-amber-500/15 px-2 py-0.5 text-xs text-amber-700 dark:text-amber-300">
                              {subItem.badge}
                            </span>
                          )}
                          {/* Show upgrade badge if user doesn't have access */}
                          {!hasAccess && (
                            <span className="rounded-full bg-gradient-to-r from-amber-500/20 to-orange-500/20 dark:from-amber-500/15 dark:to-orange-500/15 border border-amber-500/30 dark:border-amber-500/20 px-2 py-0.5 text-xs font-medium text-amber-700 dark:text-amber-300">
                              {subItem.requiredTier ? `Upgrade to ${subItem.requiredTier.toUpperCase()}` : 'Upgrade'}
                            </span>
                          )}
                        </span>
                      </Link>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </nav>

      {/* Divider */}
      <div className="mt-8">
        <div className="mb-2 flex items-center gap-2">
          <span className="text-[11px] font-medium uppercase tracking-wider text-zinc-500 dark:text-white/35">
            Account
          </span>
          <span className="h-px flex-1 bg-zinc-200/50 dark:bg-white/10" />
        </div>
        <div className="space-y-1">
          <Link
            href="/dashboard/settings"
            onClick={handleLinkClick}
            className={cn(
              "group flex w-full items-center justify-between rounded-xl px-3 py-2 text-sm transition",
              "hover:bg-zinc-100/50 dark:hover:bg-white/5"
            )}
            title={isCollapsed && !isMobile ? "Settings" : undefined}
          >
            <span className="flex items-center gap-3">
              <span className="grid h-9 w-9 place-items-center rounded-xl border border-zinc-200/50 dark:border-white/10 bg-zinc-50/50 dark:bg-white/5">
                <Settings className="h-4 w-4 text-zinc-700 dark:text-white/70" />
              </span>
              {(!isCollapsed || isMobile) && <span className="text-zinc-700 dark:text-white/75">Settings</span>}
            </span>
          </Link>
          <button
            onClick={handleLogout}
            className={cn(
              "group flex w-full items-center justify-between rounded-xl px-3 py-2 text-sm transition",
              "hover:bg-zinc-100/50 dark:hover:bg-white/5"
            )}
            title={isCollapsed && !isMobile ? "Logout" : undefined}
          >
            <span className="flex items-center gap-3">
              <span className="grid h-9 w-9 place-items-center rounded-xl border border-zinc-200/50 dark:border-white/10 bg-zinc-50/50 dark:bg-white/5">
                <LogOut className="h-4 w-4 text-zinc-700 dark:text-white/70" />
              </span>
              {(!isCollapsed || isMobile) && <span className="text-zinc-700 dark:text-white/75">Logout</span>}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}

// Search Modal Wrapper Component
function SearchModalWrapper() {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="hidden md:flex items-center gap-2 rounded-2xl border border-zinc-200/50 dark:border-white/10 bg-white/50 dark:bg-white/5 px-4 py-2 text-sm text-zinc-600 dark:text-white/70 hover:bg-zinc-100 dark:hover:bg-white/10 transition-colors cursor-pointer"
      >
        <Search className="h-4 w-4" />
        <span className="hidden lg:inline">Search leads, phone, tags…</span>
        <span className="lg:hidden">Search…</span>
      </button>
      <SearchModal open={open} onOpenChange={setOpen} />
    </>
  )
}

// Date Range Selector Component
function DateRangeSelector({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return (
    <div className="hidden md:flex items-center gap-1 rounded-2xl border border-zinc-200/50 dark:border-white/10 bg-white/50 dark:bg-white/5 p-1">
      {(['Today', '7d', '30d'] as const).map((range) => (
        <button
          key={range}
          onClick={() => onChange(range.toLowerCase())}
          className={cn(
            "px-3 py-1.5 text-xs font-medium rounded-xl transition-colors",
            value === range.toLowerCase()
              ? "bg-violet-500/10 text-violet-700 dark:text-violet-300"
              : "text-zinc-600 dark:text-white/70 hover:bg-zinc-100 dark:hover:bg-white/10"
          )}
        >
          {range}
        </button>
      ))}
      <DateRangePicker value={value} onChange={onChange} />
    </div>
  )
}

// Add Lead Button for Topbar
function AddLeadButtonTopbar() {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 rounded-2xl border border-violet-500/30 dark:border-violet-500/30 bg-violet-500/10 dark:bg-violet-500/15 px-4 py-2 text-sm font-medium text-violet-700 dark:text-violet-300 hover:bg-violet-500/20 dark:hover:bg-violet-500/20 transition-colors"
      >
        <Plus className="h-4 w-4" />
        <span className="hidden lg:inline">Add Lead</span>
      </button>
      <AddLeadDialog open={open} onOpenChange={setOpen} />
    </>
  )
}

function Topbar({ onMobileMenuToggle }: { onMobileMenuToggle: () => void }) {
  const [businessName, setBusinessName] = useState<string>('Loading...')
  const [dateRange, setDateRange] = useState<string>('30d')
  const pathname = usePathname()

  useEffect(() => {
    async function loadBusiness() {
      try {
        const business = await getBusiness()
        if (business) {
          setBusinessName(business.name)
        } else {
          setBusinessName('Business Name')
        }
      } catch (error) {
        console.error('Error loading business:', error)
        setBusinessName('Business Name')
      }
    }
    loadBusiness()
  }, [])

  // Get first letter for avatar
  const initial = businessName.charAt(0).toUpperCase()

  // Check if we're on a leads page to show leads-specific topbar features
  const isLeadsPage = pathname?.startsWith('/dashboard/leads')

  return (
    <header className="sticky top-0 z-30 border-b border-zinc-200/50 dark:border-white/10 bg-white/80 dark:bg-black/30 backdrop-blur-xl">
      <div className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-4">
          {/* Mobile menu button */}
          <button
            onClick={onMobileMenuToggle}
            className="md:hidden grid h-10 w-10 place-items-center rounded-2xl border border-zinc-200/50 dark:border-white/10 bg-white/50 dark:bg-white/5 text-zinc-600 dark:text-white/70 hover:bg-zinc-100 dark:hover:bg-white/10 transition-colors"
            aria-label="Open menu"
          >
            <Menu className="h-4 w-4" />
          </button>
          <div className="flex flex-col">
            <span className="text-sm text-zinc-500 dark:text-white/45">BRNNO</span>
            <span className="text-lg font-semibold text-zinc-900 dark:text-white">
              {businessName}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Search - shown on leads pages */}
          {isLeadsPage && (
            <SearchModalWrapper />
          )}

          {/* Date Range Selector - shown on leads pages */}
          {isLeadsPage && (
            <DateRangeSelector value={dateRange} onChange={setDateRange} />
          )}

          {/* Quick Action Button - shown on leads pages */}
          {/* Temporarily hidden - not creating leads manually for now */}
          {false && isLeadsPage && (
            <div className="hidden md:flex">
              <AddLeadButtonTopbar />
            </div>
          )}

          {/* Notifications Icon - shown on leads pages */}
          {isLeadsPage && (
            <NotificationsDropdown />
          )}

          {/* Add-ons Button */}
          <Link
            href="/dashboard/settings/subscription"
            className="flex items-center gap-2 rounded-2xl border border-violet-500/30 dark:border-violet-500/30 bg-violet-500/10 dark:bg-violet-500/15 px-4 py-2 text-sm font-medium text-violet-700 dark:text-violet-300 hover:bg-violet-500/20 dark:hover:bg-violet-500/20 transition-colors"
          >
            <Sparkles className="h-4 w-4" />
            <span className="hidden lg:inline">Add-ons</span>
          </Link>

          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}

import { CommandMenu } from "@/components/dashboard/command-menu";
import { ThemeToggle } from "@/components/theme-toggle";
import DemoBanner from "@/components/demo/demo-banner";
import { TrialEndedBanner } from "@/components/dashboard/trial-ended-banner";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="flex h-screen bg-gradient-to-br from-zinc-50 via-white to-zinc-100 dark:from-[#07070A] dark:via-[#07070A] dark:to-[#0a0a0d]">
      <CommandMenu />
      {/* Desktop Sidebar */}
      <div className="hidden md:block">
        <Sidebar isCollapsed={isCollapsed} toggleSidebar={() => setIsCollapsed(!isCollapsed)} />
      </div>

      {/* Mobile Sidebar Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/50 dark:bg-black/50 backdrop-blur-sm"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          {/* Sidebar */}
          <div className="fixed left-0 top-0 bottom-0 w-64 animate-in slide-in-from-left">
            <Sidebar
              isCollapsed={false}
              toggleSidebar={() => { }}
              isMobile={true}
              onMobileClose={() => setIsMobileMenuOpen(false)}
            />
          </div>
        </div>
      )}

      <div className="flex flex-1 flex-col overflow-hidden">
        <Topbar onMobileMenuToggle={() => setIsMobileMenuOpen(true)} />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6">
          <DemoBanner />
          <TrialEndedBanner />
          {children}
        </main>
      </div>
    </div>
  );
}

