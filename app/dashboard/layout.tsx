'use client'

import Link from "next/link";
import React, { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { signOut } from "@/lib/actions/auth";
import { getBusiness } from "@/lib/actions/business";
import { useFeatureGate } from "@/hooks/use-feature-gate";
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
} from "lucide-react";

const navigation = [
  {
    name: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    name: "SALES",
    type: "group",
    items: [
      { name: "Leads", href: "/dashboard/leads", icon: Target, requiredFeature: "limited_lead_recovery" },
      { name: "Quotes", href: "/dashboard/quotes", icon: FileText },
    ],
  },
  {
    name: "CUSTOMERS",
    type: "group",
    items: [
      { name: "Clients", href: "/dashboard/clients", icon: Users },
      { name: "Jobs", href: "/dashboard/jobs", icon: Briefcase },
      { name: "Messages", href: "/dashboard/messages", icon: MessageSquare, badge: "Soon" },
    ],
  },
  {
    name: "FINANCE",
    type: "group",
    items: [
      { name: "Invoices", href: "/dashboard/invoices", icon: Receipt },
      { name: "Reports", href: "/dashboard/reports", icon: BarChart, requiredFeature: "reports", requiredTier: "pro" },
    ],
  },
  {
    name: "BUSINESS",
    type: "group",
    items: [
      { name: "Services", href: "/dashboard/services", icon: Wrench },
      { name: "Team", href: "/dashboard/team", icon: UsersRound, requiredFeature: "team_management", requiredTier: "pro" },
      { name: "Schedule", href: "/dashboard/schedule", icon: CalendarDays },
      { name: "Reviews", href: "/dashboard/reviews", icon: Star, requiredFeature: "full_automation", requiredTier: "pro" },
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
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({})
  const { can } = useFeatureGate()
  
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
    <div className={`flex h-full flex-col border-r border-zinc-200 dark:border-zinc-800/50 bg-white dark:bg-zinc-900/95 backdrop-blur-sm transition-all duration-300 ${isCollapsed && !isMobile ? 'w-16' : 'w-64'}`}>
      {/* Logo / Business Name */}
      <div className="flex h-16 items-center justify-between border-b border-zinc-200 dark:border-zinc-800/50 px-6">
        {(!isCollapsed || isMobile) && (
          <h1 className="text-xl font-bold text-zinc-900 dark:text-white">
            BRNNO
          </h1>
        )}
        {isMobile ? (
          <button
            onClick={onMobileClose}
            className="rounded-lg p-1.5 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800/50 hover:text-zinc-900 dark:hover:text-white transition-colors"
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </button>
        ) : (
          <button
            onClick={toggleSidebar}
            className="rounded-lg p-1.5 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800/50 hover:text-zinc-900 dark:hover:text-white transition-colors"
            aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {isCollapsed ? "→" : "←"}
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto space-y-1 px-3 py-4">
        {navigation.map((item) => {
          // Single item (Dashboard)
          if (!item.type) {
            const Icon = item.icon as React.ComponentType<{ className?: string }>
            const isActive = pathname === item.href
            
            if (!Icon) return null
            
            return (
              <Link
                key={item.name}
                href={item.href!}
                onClick={handleLinkClick}
                className={`group relative flex items-center rounded-lg px-3 py-2.5 text-sm font-medium transition-all min-h-[44px] ${
                  isActive 
                    ? 'bg-gradient-to-r from-blue-600/20 to-purple-600/20 text-blue-700 dark:text-white border-l-2 border-blue-500' 
                    : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800/50 hover:text-zinc-900 dark:hover:text-white'
                }`}
                title={isCollapsed && !isMobile ? item.name : undefined}
              >
                <Icon className={`h-5 w-5 ${isCollapsed && !isMobile ? '' : 'mr-3'}`} />
                {(!isCollapsed || isMobile) && <span>{item.name}</span>}
              </Link>
            )
          }

          // Group
          if (isCollapsed && !isMobile) {
            // When collapsed, show only group icon (first item's icon)
            const FirstIcon = item.items?.[0]?.icon as React.ComponentType<{ className?: string }> | undefined
            return FirstIcon ? (
              <div key={item.name} className="py-2">
                <div className="h-8 w-8 mx-auto rounded-lg bg-zinc-100 dark:bg-zinc-800/50 flex items-center justify-center">
                  <FirstIcon className="h-4 w-4 text-zinc-600 dark:text-zinc-400" />
                </div>
              </div>
            ) : null
          }

          const isGroupCollapsed = collapsedGroups[item.name]
          
          return (
            <div key={item.name} className="space-y-1">
              {/* Group Header */}
              <button
                onClick={() => toggleGroup(item.name)}
                className="w-full flex items-center justify-between px-3 py-2 text-xs font-semibold text-zinc-500 dark:text-zinc-500 uppercase tracking-wider hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors"
              >
                {item.name}
                {!isMobile && (
                  <ChevronDown 
                    className={`h-3 w-3 transition-transform duration-200 ${isGroupCollapsed ? '-rotate-90' : ''}`}
                  />
                )}
              </button>

              {/* Group Items */}
              {!isGroupCollapsed && (
                <div className="space-y-1 ml-2">
                  {item.items?.map((subItem) => {
                    const Icon = subItem.icon as React.ComponentType<{ className?: string }> | undefined
                    const isActive = pathname === subItem.href || (subItem.href !== '/dashboard' && pathname?.startsWith(subItem.href))
                    
                    // Hide items that require features the user doesn't have
                    if (subItem.requiredFeature && !can(subItem.requiredFeature)) {
                      return null
                    }
                    
                    if (!Icon) return null
                    
                    return (
                      <Link
                        key={subItem.name}
                        href={subItem.href}
                        onClick={handleLinkClick}
                        className={`group relative flex items-center rounded-lg px-3 py-2.5 text-sm font-medium transition-all min-h-[44px] ${
                          isActive 
                            ? 'bg-gradient-to-r from-blue-600/20 to-purple-600/20 text-blue-700 dark:text-white border-l-2 border-blue-500' 
                            : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800/50 hover:text-zinc-900 dark:hover:text-white'
                        }`}
                      >
                        <Icon className="h-5 w-5 mr-3" />
                        <span className="flex-1">{subItem.name}</span>
                        {subItem.badge && (
                          <span className="ml-2 text-xs bg-yellow-500/20 text-yellow-400 px-2 py-0.5 rounded-full border border-yellow-500/30">
                            {subItem.badge}
                          </span>
                        )}
                        {subItem.requiredTier && !can(subItem.requiredFeature || '') && (
                          <span className="ml-2 text-xs bg-blue-500/20 text-blue-400 dark:text-blue-300 px-2 py-0.5 rounded-full border border-blue-500/30">
                            {subItem.requiredTier.toUpperCase()}
                          </span>
                        )}
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
      <div className="border-t border-zinc-200 dark:border-zinc-800/50"></div>

      {/* Settings and Logout */}
      <div className="space-y-1 px-3 py-4">
        <Link
          href="/dashboard/settings"
          onClick={handleLinkClick}
          className="group flex items-center rounded-lg px-3 py-2.5 text-sm font-medium text-zinc-600 dark:text-zinc-400 transition-all hover:bg-zinc-100 dark:hover:bg-zinc-800/50 hover:text-zinc-900 dark:hover:text-white min-h-[44px]"
          title={isCollapsed && !isMobile ? "Settings" : undefined}
        >
          <Settings className={`h-5 w-5 ${isCollapsed && !isMobile ? '' : 'mr-3'}`} />
          {(!isCollapsed || isMobile) && <span>Settings</span>}
        </Link>
        <button
          onClick={handleLogout}
          className="group flex w-full items-center rounded-lg px-3 py-2.5 text-sm font-medium text-zinc-600 dark:text-zinc-400 transition-all hover:bg-zinc-100 dark:hover:bg-zinc-800/50 hover:text-zinc-900 dark:hover:text-white min-h-[44px]"
          title={isCollapsed && !isMobile ? "Logout" : undefined}
        >
          <LogOut className={`h-5 w-5 ${isCollapsed && !isMobile ? '' : 'mr-3'}`} />
          {(!isCollapsed || isMobile) && <span>Logout</span>}
        </button>
      </div>
    </div>
  );
}

function Topbar({ onMobileMenuToggle }: { onMobileMenuToggle: () => void }) {
  const [businessName, setBusinessName] = useState<string>('Loading...')

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

  return (
    <header className="flex h-16 items-center justify-between border-b border-zinc-200 dark:border-zinc-800/30 bg-white/80 dark:bg-zinc-900/50 backdrop-blur-sm px-4 sm:px-6">
      <div className="flex items-center gap-3">
        {/* Mobile menu button */}
        <button
          onClick={onMobileMenuToggle}
          className="md:hidden p-2 rounded-lg text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800/50 hover:text-zinc-900 dark:hover:text-white transition-colors"
          aria-label="Open menu"
        >
          <Menu className="h-6 w-6" />
        </button>
        <h2 className="text-base sm:text-lg font-semibold text-zinc-900 dark:text-white truncate">
          {businessName}
        </h2>
      </div>
      <div className="flex items-center gap-2 sm:gap-4">
        <ThemeToggle />
        <Link
          href="/dashboard/settings"
          className="hidden sm:flex rounded-lg px-3 py-2 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800/50 hover:text-zinc-900 dark:hover:text-white transition-colors"
        >
          Settings
        </Link>
        <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center text-white shadow-lg">
          <span className="text-sm font-medium">{initial}</span>
        </div>
      </div>
    </header>
  );
}

import { CommandMenu } from "@/components/dashboard/command-menu";
import { ThemeToggle } from "@/components/theme-toggle";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="flex h-screen bg-gradient-to-br from-zinc-50 via-white to-zinc-100 dark:from-zinc-950 dark:via-black dark:to-zinc-900">
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
              toggleSidebar={() => {}} 
              isMobile={true}
              onMobileClose={() => setIsMobileMenuOpen(false)}
            />
          </div>
        </div>
      )}

      <div className="flex flex-1 flex-col overflow-hidden">
        <Topbar onMobileMenuToggle={() => setIsMobileMenuOpen(true)} />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}

