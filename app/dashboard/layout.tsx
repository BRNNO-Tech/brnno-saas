'use client'

import Link from "next/link";
import React, { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { signOut } from "@/lib/actions/auth";
import { getBusiness } from "@/lib/actions/business";
import { useFeatureGate } from "@/hooks/use-feature-gate";
import { getUnreadLeadsCount } from "@/lib/actions/leads";
import { hasSubscriptionAddon } from "@/lib/actions/subscription-addons";
import { Barlow, Barlow_Condensed, DM_Mono } from "next/font/google";

const barlow = Barlow({ weight: ["400", "500", "600"], subsets: ["latin"], variable: "--font-barlow" });
const barlowCondensed = Barlow_Condensed({ weight: ["400", "500", "600", "700", "800", "900"], subsets: ["latin"], variable: "--font-barlow-condensed" });
const dmMono = DM_Mono({ weight: ["400", "500"], subsets: ["latin"], variable: "--font-dm-mono" });

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}
import {
  LayoutDashboard,
  Users,
  Target,
  Wrench,
  CalendarDays,
  Receipt,
  Settings,
  LogOut,
  Menu,
  X,
  MessageSquare,
  Briefcase,
  UsersRound,
  ClipboardList,
  Package,
  PlayCircle,
  Plus,
  Navigation,
  Camera,
  Sparkles,
  Repeat,
} from "lucide-react";
import { OpenNewJobProvider } from "@/lib/contexts/open-new-job-context";

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
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  {
    name: "LEAD RECOVERY",
    type: "group",
    items: [
      { name: "Recovery Command Center", href: "/dashboard/leads", icon: Target, requiredFeature: "limited_lead_recovery", requiredTier: "pro" },
      { name: "Auto Follow-Up", href: "/dashboard/leads/sequences", icon: PlayCircle, requiredFeature: "lead_recovery_dashboard", requiredTier: "pro" },
    ],
  },
  {
    name: "CUSTOMERS",
    type: "group",
    items: [
      { name: "Customers", href: "/dashboard/customers", icon: Users },
      { name: "Maintenance", href: "/dashboard/customers/maintenance", icon: Repeat },
      { name: "Jobs", href: "/dashboard/jobs", icon: Briefcase },
      { name: "Photos", href: "/dashboard/photos", icon: Camera },
      { name: "Quick Quote", href: "/dashboard/quick-quote", icon: Sparkles },
      { name: "Messages", href: "/dashboard/messages", icon: MessageSquare },
    ],
  },
  {
    name: "BUSINESS",
    type: "group",
    items: [
      { name: "Services", href: "/dashboard/services", icon: Wrench },
      { name: "Checklist Templates", href: "/dashboard/checklist-templates", icon: ClipboardList },
      { name: "Team", href: "/dashboard/team", icon: UsersRound, requiredFeature: "team_management", requiredTier: "pro" },
      { name: "Inventory", href: "/dashboard/inventory", icon: Package },
      { name: "Mileage", href: "/dashboard/mileage", icon: Navigation, badge: "Beta" },
      { name: "Invoices", href: "/dashboard/invoices", icon: Receipt },
      { name: "Calendar", href: "/dashboard/schedule", icon: CalendarDays },
    ],
  },
];

/** Flat list of all nav items for 64px icon-only sidebar (Dashboard first, then each group's items, then Settings) */
function getFlatNavItems(): Array<{ item: NavigationItem; hasAccess: boolean; displayName: string }> {
  const flat: Array<{ item: NavigationItem; hasAccess: boolean; displayName: string }> = [];
  flat.push({ item: navigation[0] as NavigationItem, hasAccess: true, displayName: "Dashboard" });
  for (const entry of navigation.slice(1)) {
    if ("type" in entry && entry.type === "group") {
      for (const sub of entry.items) {
        flat.push({ item: sub, hasAccess: true, displayName: sub.name });
      }
    }
  }
  return flat;
}

const ROUTE_TITLES: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/dashboard/leads": "Leads",
  "/dashboard/leads/sequences": "Auto Follow-Up",
  "/dashboard/customers": "Customers",
  "/dashboard/customers/maintenance": "Maintenance",
  "/dashboard/jobs": "Jobs",
  "/dashboard/photos": "Photos",
  "/dashboard/quick-quote": "Quick Quote",
  "/dashboard/messages": "Messages",
  "/dashboard/services": "Services",
  "/dashboard/checklist-templates": "Checklist Templates",
  "/dashboard/team": "Team",
  "/dashboard/inventory": "Inventory",
  "/dashboard/mileage": "Mileage",
  "/dashboard/invoices": "Invoices",
  "/dashboard/schedule": "Calendar",
  "/dashboard/settings": "Settings",
};

function getPageTitle(pathname: string | null): string {
  if (!pathname) return "Dashboard";
  for (let len = pathname.length; len > 0; len--) {
    const sub = pathname.slice(0, len);
    if (ROUTE_TITLES[sub]) return ROUTE_TITLES[sub];
  }
  return "Dashboard";
}

function formatTopbarDate(): string {
  const d = new Date();
  const days = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
  const months = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
  return `${days[d.getDay()]} ${String(d.getDate()).padStart(2, "0")} ${months[d.getMonth()]} ${d.getFullYear()}`;
}

function Sidebar({ isMobile = false, onMobileClose }: { isMobile?: boolean; onMobileClose?: () => void }) {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const [businessName, setBusinessName] = useState<string>("Business");
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [hasAIAutoLeadAddon, setHasAIAutoLeadAddon] = useState<boolean>(false);
  const { can, tier } = useFeatureGate();

  useEffect(() => setMounted(true), []);
  useEffect(() => {
    getBusiness().then((b) => { if (b?.name) setBusinessName(b.name); }).catch(() => {});
  }, []);
  useEffect(() => {
    if (!can("lead_recovery_dashboard")) return;
    let isMounted = true;
    hasSubscriptionAddon("ai_auto_lead").then((has) => { if (isMounted) setHasAIAutoLeadAddon(has); }).catch(() => {});
    return () => { isMounted = false; };
  }, [tier, can]);
  useEffect(() => {
    if (!can("lead_recovery_dashboard")) { setUnreadCount(0); return; }
    let isMounted = true;
    getUnreadLeadsCount().then((c) => { if (isMounted) setUnreadCount(c); }).catch(() => {});
    const iv = setInterval(() => { if (document.visibilityState === "visible") getUnreadLeadsCount().then((c) => { if (isMounted) setUnreadCount(c); }); }, 30000);
    return () => { isMounted = false; clearInterval(iv); };
  }, []);

  const flatNav = getFlatNavItems();
  const hasAccess = (item: NavigationItem) => {
    if (!item.requiredFeature) return true;
    if (!can(item.requiredFeature)) return false;
    if (!item.requiredTier) return true;
    if (item.requiredTier === "pro" && (tier === "pro" || tier === "fleet")) return true;
    if (item.requiredTier === "fleet" && tier === "fleet") return true;
    return false;
  };
  const sequencesItem = (item: NavigationItem) => item.href === "/dashboard/leads/sequences";

  return (
    <aside
      className={cn(
        "flex flex-col w-16 flex-shrink-0 border-r bg-[var(--dash-graphite)] border-[var(--dash-border)]",
        "fixed top-0 left-0 bottom-0 z-50",
        isMobile ? "w-64" : "w-16"
      )}
      style={isMobile ? { width: 256 } : { width: 64 }}
    >
      <div className={cn("flex h-14 items-center border-b border-[var(--dash-border)] px-2", isMobile ? "justify-between" : "justify-center")}>
        {isMobile ? (
          <>
            <Link href="/dashboard" onClick={onMobileClose} className="flex h-9 w-9 items-center justify-center rounded bg-[var(--dash-amber)] text-[10px] font-extrabold text-[var(--dash-black)] font-dash-condensed">BR</Link>
            <button type="button" onClick={onMobileClose} className="grid h-10 w-10 place-items-center rounded text-[var(--dash-text-muted)] hover:bg-[var(--dash-surface)]" aria-label="Close menu">
              <X className="h-5 w-5" />
            </button>
          </>
        ) : (
          <Link href="/dashboard" className="flex h-9 w-9 items-center justify-center rounded bg-[var(--dash-amber)] text-[10px] font-extrabold text-[var(--dash-black)] font-dash-condensed tracking-tight" title="BRNNO">BR</Link>
        )}
      </div>
      <nav className={cn("flex-1 overflow-y-auto py-4 flex flex-col gap-0.5 px-2", isMobile ? "items-stretch" : "items-center")}>
        {flatNav.map(({ item, displayName }) => {
          const Icon = item.icon as React.ComponentType<{ className?: string }>;
          const access = hasAccess(item) && (sequencesItem(item) ? hasAIAutoLeadAddon : true);
          const href = access ? item.href : "/dashboard/settings/subscription";
          const isActive = mounted && (pathname === item.href || (item.href !== "/dashboard" && pathname?.startsWith(item.href)));
          if (!Icon) return null;
          const label = item.href === "/dashboard/leads/sequences" && hasAIAutoLeadAddon ? "AI Auto Follow-Up" : displayName;
          return (
            <Link
              key={item.href + item.name}
              href={href}
              onClick={isMobile && onMobileClose ? onMobileClose : undefined}
              title={label}
              className={cn(
                "flex items-center rounded transition-colors relative gap-3",
                isMobile ? "h-11 px-3" : "h-11 w-11 justify-center",
                "text-[var(--dash-text-muted)] hover:bg-[var(--dash-surface)] hover:text-[var(--dash-text-dim)]",
                isActive && "bg-[var(--dash-amber-glow)] text-[var(--dash-amber)]",
                !access && "opacity-60"
              )}
            >
              {isActive && <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-6 bg-[var(--dash-amber)] rounded-r" />}
              <Icon className="h-[18px] w-[18px] flex-shrink-0" />
              {isMobile && <span className="text-sm truncate">{label}</span>}
              {item.href === "/dashboard/leads" && unreadCount > 0 && (
                <span className="ml-auto h-4 min-w-4 rounded-full bg-[var(--dash-amber)] text-[10px] font-bold text-[var(--dash-black)] flex items-center justify-center px-1">{unreadCount > 99 ? "99+" : unreadCount}</span>
              )}
            </Link>
          );
        })}
      </nav>
      <div className={cn("mt-auto flex flex-col border-t border-[var(--dash-border)] py-3 px-2", isMobile ? "gap-0" : "items-center gap-0.5")}>
        <Link href="/dashboard/settings" onClick={isMobile && onMobileClose ? onMobileClose : undefined} title="Settings" className={cn("flex items-center rounded text-[var(--dash-text-muted)] hover:bg-[var(--dash-surface)] hover:text-[var(--dash-text-dim)]", isMobile ? "h-11 px-3 gap-3" : "h-11 w-11 justify-center")}>
          <Settings className="h-[18px] w-[18px] flex-shrink-0" />
          {isMobile && <span className="text-sm">Settings</span>}
        </Link>
        <form action={signOut} className="block">
          <button type="submit" title="Log out" className={cn("flex w-full items-center rounded text-[var(--dash-text-muted)] hover:bg-[var(--dash-surface)] hover:text-[var(--dash-text-dim)]", isMobile ? "h-11 px-3 gap-3" : "h-11 w-11 justify-center")}>
            <LogOut className="h-[18px] w-[18px] flex-shrink-0" />
            {isMobile && <span className="text-sm">Log out</span>}
          </button>
        </form>
        <div className={cn("flex items-center justify-center rounded-full bg-[var(--dash-border-bright)] text-[13px] font-bold font-dash-condensed text-[var(--dash-text-dim)] mt-2", isMobile ? "h-10 w-10 mx-auto" : "h-8 w-8")} title={businessName}>
          {businessName.slice(0, 2).toUpperCase()}
        </div>
      </div>
    </aside>
  );
}

function Topbar({ onMobileMenuToggle }: { onMobileMenuToggle: () => void }) {
  const pathname = usePathname();
  const title = getPageTitle(pathname);
  const dateStr = formatTopbarDate();

  return (
    <header className="sticky top-0 z-40 h-14 border-b border-[var(--dash-border)] bg-[var(--dash-graphite)] flex items-center justify-between px-6">
      <div className="flex items-center gap-3">
        <button type="button" onClick={onMobileMenuToggle} className="md:hidden flex h-9 w-9 items-center justify-center rounded text-[var(--dash-text-muted)] hover:bg-[var(--dash-surface)]" aria-label="Open menu">
          <Menu className="h-5 w-5" />
        </button>
        <span className="font-dash-condensed font-extrabold text-xl uppercase tracking-wide text-[var(--dash-text)]">{title}</span>
        <span className="font-dash-mono text-[11px] text-[var(--dash-text-muted)] tracking-wider hidden sm:inline">{dateStr}</span>
      </div>
      <div className="flex items-center gap-3">
        <Link href="/dashboard/settings/subscription" className="flex items-center gap-1.5 px-2.5 py-1.5 border border-[var(--dash-border)] font-dash-mono text-[10px] uppercase tracking-wider text-[var(--dash-text-muted)] hover:bg-[var(--dash-surface)] hover:text-[var(--dash-text)] transition-colors">
          <Sparkles className="h-3 w-3" />
          Upgrade
        </Link>
        <div className="flex items-center gap-1.5 px-2.5 py-1 border border-[var(--dash-border-bright)] font-dash-mono text-[10px] uppercase tracking-wider text-[var(--dash-text-dim)]">
          <span className="h-1.5 w-1.5 rounded-full bg-[var(--dash-green)] shadow-[0_0_6px_var(--dash-green)] animate-pulse" />
          ONLINE
        </div>
        <CreateJobButton
          trigger={
            <button type="button" className="flex items-center gap-1.5 px-3.5 py-2 bg-[var(--dash-amber)] text-[var(--dash-black)] font-dash-condensed font-bold text-[13px] uppercase tracking-wider hover:opacity-90 transition-opacity">
              <Plus className="h-3.5 w-3.5" />
              NEW JOB
            </button>
          }
        />
      </div>
    </header>
  );
}

import { CommandMenu } from "@/components/dashboard/command-menu";
import DemoBanner from "@/components/demo/demo-banner";
import { TrialEndedBanner } from "@/components/dashboard/trial-ended-banner";
import MobileBottomNav from "@/components/dashboard/mobile-bottom-nav";
import CreateJobButton from "@/components/jobs/create-job-button";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <OpenNewJobProvider>
    <div
      className={cn(
        "dashboard-theme dashboard-theme-grain min-h-screen bg-[var(--dash-black)] text-[var(--dash-text)]",
        barlow.variable,
        barlowCondensed.variable,
        dmMono.variable,
        barlow.className
      )}
    >
      <CommandMenu />
      <div className="hidden md:block">
        <Sidebar />
      </div>
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsMobileMenuOpen(false)} aria-hidden />
          <div className="fixed left-0 top-0 bottom-0 w-64 bg-[var(--dash-graphite)] border-r border-[var(--dash-border)] animate-in slide-in-from-left">
            <Sidebar isMobile onMobileClose={() => setIsMobileMenuOpen(false)} />
          </div>
        </div>
      )}
      <div className="flex flex-1 flex-col min-h-screen md:ml-16">
        <Topbar onMobileMenuToggle={() => setIsMobileMenuOpen(true)} />
        <main className="flex-1 overflow-y-auto p-6 pb-20 md:pb-6">
          <DemoBanner />
          <TrialEndedBanner />
          {children}
        </main>
      </div>
      <MobileBottomNav />
    </div>
    </OpenNewJobProvider>
  );
}

