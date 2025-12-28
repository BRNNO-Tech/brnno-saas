'use client'

import Link from "next/link";
import { useState, useEffect } from "react";
import { signOut } from "@/lib/actions/auth";
import { getBusiness } from "@/lib/actions/business";
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
} from "lucide-react";

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Clients", href: "/dashboard/clients", icon: Users },
  { name: "Leads", href: "/dashboard/leads", icon: Target },
  { name: "Team", href: "/dashboard/team", icon: Users },
  { name: "Services", href: "/dashboard/services", icon: Wrench },
  { name: "Schedule", href: "/dashboard/schedule", icon: CalendarDays },
  { name: "Jobs", href: "/dashboard/jobs", icon: Calendar },
  { name: "Quotes", href: "/dashboard/quotes", icon: FileText },
  { name: "Invoices", href: "/dashboard/invoices", icon: Receipt },
  { name: "Reports", href: "/dashboard/reports", icon: BarChart },
  { name: "Reviews", href: "/dashboard/reviews", icon: Star },
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
  async function handleLogout() {
    // Use server action for proper cookie handling
    await signOut()
  }

  const handleLinkClick = () => {
    if (isMobile && onMobileClose) {
      onMobileClose()
    }
  }

  return (
    <div className={`flex h-full flex-col border-r border-zinc-200 bg-white transition-all duration-300 dark:border-zinc-800 dark:bg-zinc-900 ${isCollapsed && !isMobile ? 'w-16' : 'w-64'}`}>
      {/* Logo / Business Name */}
      <div className="flex h-16 items-center justify-between border-b border-zinc-200 px-6 dark:border-zinc-800">
        {(!isCollapsed || isMobile) && (
          <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-50">
            BRNNO
          </h1>
        )}
        {isMobile ? (
          <button
            onClick={onMobileClose}
            className="rounded-md p-1.5 text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </button>
        ) : (
          <button
            onClick={toggleSidebar}
            className="rounded-md p-1.5 text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
            aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {isCollapsed ? "→" : "←"}
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-3 py-4">
        {navigation.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.name}
              href={item.href}
              onClick={handleLinkClick}
              className="group flex items-center rounded-md px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-zinc-50 min-h-[44px]"
              title={isCollapsed && !isMobile ? item.name : undefined}
            >
              <Icon className={`h-5 w-5 ${isCollapsed && !isMobile ? '' : 'mr-3'}`} />
              {(!isCollapsed || isMobile) && <span>{item.name}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Divider */}
      <div className="border-t border-zinc-200 dark:border-zinc-800"></div>

      {/* Settings and Logout */}
      <div className="space-y-1 px-3 py-4">
        <Link
          href="/dashboard/settings"
          onClick={handleLinkClick}
          className="group flex items-center rounded-md px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-zinc-50 min-h-[44px]"
          title={isCollapsed && !isMobile ? "Settings" : undefined}
        >
          <Settings className={`h-5 w-5 ${isCollapsed && !isMobile ? '' : 'mr-3'}`} />
          {(!isCollapsed || isMobile) && <span>Settings</span>}
        </Link>
        <button
          onClick={handleLogout}
          className="group flex w-full items-center rounded-md px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-zinc-50 min-h-[44px]"
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
    <header className="flex h-16 items-center justify-between border-b border-zinc-200 bg-white px-4 sm:px-6 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex items-center gap-3">
        {/* Mobile menu button */}
        <button
          onClick={onMobileMenuToggle}
          className="md:hidden p-2 rounded-md text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
          aria-label="Open menu"
        >
          <Menu className="h-6 w-6" />
        </button>
        <h2 className="text-base sm:text-lg font-semibold text-zinc-900 dark:text-zinc-50 truncate">
          {businessName}
        </h2>
      </div>
      <div className="flex items-center gap-2 sm:gap-4">
        <Link
          href="/dashboard/settings"
          className="hidden sm:flex rounded-md px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
        >
          Settings
        </Link>
        <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-full bg-zinc-300 dark:bg-zinc-700 flex items-center justify-center text-zinc-600 dark:text-zinc-400">
          <span className="text-sm font-medium">{initial}</span>
        </div>
      </div>
    </header>
  );
}

import { CommandMenu } from "@/components/dashboard/command-menu";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="flex h-screen bg-zinc-50 dark:bg-black">
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
            className="fixed inset-0 bg-black/50 backdrop-blur-sm"
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

