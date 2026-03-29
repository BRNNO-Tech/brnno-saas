'use client'

import Link from "next/link";
import React, { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { getBusiness } from "@/lib/actions/business";
import { useFeatureGate } from "@/hooks/use-feature-gate";
import { getUnreadLeadsCount } from "@/lib/actions/leads";
import { hasAIAutoLeadAccess } from "@/lib/actions/subscription-addons";

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function preventDoubleLogoutSubmit(e: React.FormEvent<HTMLFormElement>) {
  const btn = e.currentTarget.querySelector('button[type="submit"]') as HTMLButtonElement | null
  if (btn) btn.disabled = true
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
  X,
  MessageSquare,
  Briefcase,
  UsersRound,
  ClipboardList,
  Package,
  PlayCircle,
  Navigation,
  Camera,
  Sparkles,
  Repeat,
  Star,
  Megaphone,
  Tag,
} from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

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
      { name: "Leads", href: "/dashboard/leads", icon: Target, requiredFeature: "limited_lead_recovery", requiredTier: "pro" },
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
      { name: "Messages", href: "/dashboard/messages", icon: MessageSquare, requiredFeature: "messaging", requiredTier: "pro" },
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
      { name: "Reviews", href: "/dashboard/reviews", icon: Star },
      { name: "Calendar", href: "/dashboard/schedule", icon: CalendarDays },
    ],
  },
  {
    name: "MARKETING",
    type: "group",
    items: [
      { name: "Campaigns", href: "/dashboard/marketing/campaigns", icon: Megaphone },
      { name: "Promo Codes", href: "/dashboard/marketing/promo-codes", icon: Tag },
      { name: "Caption Generator", href: "/dashboard/marketing/caption-generator", icon: Sparkles },
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

export function SidebarMobile({
  isMobile = false,
  onMobileClose,
  /** When embedded in the mobile slide-out shell, avoid nested `fixed` (layout + positioning bugs). */
  variant = 'fixed',
}: {
  isMobile?: boolean
  onMobileClose?: () => void
  variant?: 'fixed' | 'drawer'
}) {
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
    hasAIAutoLeadAccess().then((has) => { if (isMounted) setHasAIAutoLeadAddon(has); }).catch(() => {});
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

  const isDrawer = variant === 'drawer'

  return (
    <aside
      className={cn(
        'flex flex-col flex-shrink-0 border-r bg-[var(--dash-graphite)] border-[var(--dash-border)]',
        isDrawer
          ? 'relative z-auto h-full min-h-0 w-full min-w-0'
          : 'fixed top-0 left-0 bottom-0 z-50 w-64 max-w-[min(100vw,16rem)]',
      )}
    >
      <div className={cn("flex h-14 items-center border-b border-[var(--dash-border)] px-2", isMobile ? "justify-between" : "justify-center")}>
	{(
	  <>
	    <Link href="/dashboard" onClick={onMobileClose} className="flex h-9 w-9 items-center justify-center rounded bg-[var(--dash-amber)] text-[10px] font-extrabold text-[var(--dash-black)] font-dash-condensed">BR</Link>
	    <button type="button" onClick={onMobileClose} className="grid h-10 w-10 place-items-center rounded text-[var(--dash-text)] hover:bg-[var(--dash-surface)]" aria-label="Close menu">
	      <X className="h-5 w-5" />
	    </button>
	  </>
	)}
      </div>
      <nav className={cn("flex-1 overflow-y-auto py-4 flex flex-col gap-0.5 px-2", "items-stretch")}>
	{flatNav.map(({ item, displayName }) => {
	  const Icon = item.icon as React.ComponentType<{ className?: string }>;
	  const access = hasAccess(item) && (sequencesItem(item) ? hasAIAutoLeadAddon : true);
	  // Leads and Auto Follow-Up show their own upgrade prompt; send there so user sees "Upgrade to Pro" / "Add module"
	  const leadsOrSequences = item.href === '/dashboard/leads' || item.href === '/dashboard/leads/sequences';
	  const href = access ? item.href : (leadsOrSequences ? item.href : '/dashboard/settings/subscription');
	  const isActive = mounted && (pathname === item.href || (item.href !== "/dashboard" && pathname?.startsWith(item.href)));
	  if (!Icon) return null;
	  const label = item.href === "/dashboard/leads/sequences" && hasAIAutoLeadAddon ? "AI Auto Follow-Up" : displayName;
	  const linkClassName = cn(
	    "flex items-center rounded transition-colors relative gap-3",
	    "h-11 px-3",
	    "text-[var(--dash-text)] hover:bg-[var(--dash-surface)] hover:text-[var(--dash-text-dim)]",
	    isActive && "bg-[var(--dash-amber-glow)] text-[var(--dash-amber)]",
	    !access && "opacity-60"
	  );
	  const linkContent = (
	    <>
	      {isActive && <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-6 bg-[var(--dash-amber)] rounded-r" />}
	      <Icon className="h-[18px] w-[18px] flex-shrink-0" />
	      {<span className="text-sm truncate">{label}</span>}
	      {item.href === "/dashboard/leads" && unreadCount > 0 && (
		<span className="ml-auto h-4 min-w-4 rounded-full bg-[var(--dash-amber)] text-[10px] font-bold text-[var(--dash-black)] flex items-center justify-center px-1">{unreadCount > 99 ? "99+" : unreadCount}</span>
	      )}
	    </>
	  );
	  const link = (
	    <Link href={href} onClick={onMobileClose} title={label} className={linkClassName}>
	      {linkContent}
	    </Link>
	  );
	  return <React.Fragment key={item.href + item.name}>{link}</React.Fragment>;
	})}
      </nav>
      <div className={cn("mt-auto flex flex-col border-t border-[var(--dash-border)] py-3 px-2", isMobile ? "gap-0" : "items-center gap-0.5")}>
	{(
	  <Link href="/dashboard/settings" onClick={onMobileClose} className="flex items-center h-11 px-3 gap-3 rounded text-[var(--dash-text)] hover:bg-[var(--dash-surface)] hover:text-[var(--dash-text-dim)]">
	    <Settings className="h-[18px] w-[18px] flex-shrink-0" />
	    <span className="text-sm">Settings</span>
	  </Link>
	)}
	<form action="/api/auth/signout" method="POST" className="block" onSubmit={preventDoubleLogoutSubmit}>
	  {(
	    <button type="submit" className="flex w-full h-11 px-3 gap-3 items-center rounded text-[var(--dash-text)] hover:bg-[var(--dash-surface)] hover:text-[var(--dash-text-dim)]">
	      <LogOut className="h-[18px] w-[18px] flex-shrink-0" />
	      <span className="text-sm">Log out</span>
	    </button>
	  )}
	</form>
	{(
	  <div className={cn("flex items-center justify-center rounded-full bg-[var(--dash-border-bright)] text-[13px] font-bold font-dash-condensed text-[var(--dash-text-dim)] mt-2 h-10 w-10 mx-auto")} title={businessName}>
	    {businessName.slice(0, 2).toUpperCase()}
	  </div>
	)}
      </div>
    </aside>
  );
}

export function SidebarDesktop() {
  const [isDesktopSidebarExpanded, setIsDesktopSidebarExpanded] = useState(false);

//   const isDesktopSidebarExpanded = false;
//   const onMobileClose = () => {setIsDesktopSidebarExpanded(false)};
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
    hasAIAutoLeadAccess().then((has) => { if (isMounted) setHasAIAutoLeadAddon(has); }).catch(() => {});
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
	"flex flex-col w-16 flex-shrink-0 border-r bg-[var(--dash-glass)] border-[var(--dash-border)]",
	"fixed top-0 left-0 bottom-0 z-50",
	isDesktopSidebarExpanded ? "w-64" : "w-16",
        "transition-[width] duration-200 ease-out",
      )}
      style={ { ...{ backdropFilter: "blur(20px)" }, ...isDesktopSidebarExpanded ? { width: 256 } : { width: 64 } }}
      onMouseEnter={() => { setIsDesktopSidebarExpanded(true) }}
      onMouseLeave={() => { setIsDesktopSidebarExpanded(false) }}
    >
      <div className={cn("flex h-14 items-center border-b border-[var(--dash-border)] px-2", "justify-between")}>
	{(
	  <Tooltip>
	    <TooltipTrigger asChild>
	      <Link href="/dashboard" className="flex h-9 w-9 items-center justify-center rounded bg-[var(--dash-amber)] text-[10px] font-extrabold text-[var(--dash-black)] font-dash-condensed tracking-tight">BR</Link>
	    </TooltipTrigger>
	    <TooltipContent side="right" sideOffset={8} className="bg-[var(--dash-surface)] text-[var(--dash-text)] border-[var(--dash-border)] font-dash-condensed text-xs">
	      BRNNO
	    </TooltipContent>
	  </Tooltip>
	)}
      </div>
      <nav className={cn("flex-1 overflow-y-auto py-4 flex flex-col gap-0.5 px-2", "items-stretch")}>
	{flatNav.map(({ item, displayName }) => {
	  const Icon = item.icon as React.ComponentType<{ className?: string }>;
	  const access = hasAccess(item) && (sequencesItem(item) ? hasAIAutoLeadAddon : true);
	  // Leads and Auto Follow-Up show their own upgrade prompt; send there so user sees "Upgrade to Pro" / "Add module"
	  const leadsOrSequences = item.href === '/dashboard/leads' || item.href === '/dashboard/leads/sequences';
	  const href = access ? item.href : (leadsOrSequences ? item.href : '/dashboard/settings/subscription');
	  const isActive = mounted && (pathname === item.href || (item.href !== "/dashboard" && pathname?.startsWith(item.href)));
	  if (!Icon) return null;
	  const label = item.href === "/dashboard/leads/sequences" && hasAIAutoLeadAddon ? "AI Auto Follow-Up" : displayName;
	  const linkClassName = cn(
	    "flex items-center rounded transition-colors relative gap-3",
	    "h-11 px-3",
	    "text-[var(--dash-text)] hover:bg-[var(--dash-surface)] hover:text-[var(--dash-text-dim)]",
	    isActive && "bg-[var(--dash-amber-glow)] text-[var(--dash-amber)]",
	    !access && "opacity-60"
	  );
	  const linkContent = (
	    <>
	      {isActive && <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-6 bg-[var(--dash-amber)] rounded-r" />}
	      <Icon className="h-[18px] w-[18px] flex-shrink-0" />
	      {<span className="text-sm truncate">{label}</span>}
	      {item.href === "/dashboard/leads" && unreadCount > 0 && (
		<span className="ml-auto h-4 min-w-4 rounded-full bg-[var(--dash-amber)] text-[10px] font-bold text-[var(--dash-black)] flex items-center justify-center px-1">{unreadCount > 99 ? "99+" : unreadCount}</span>
	      )}
	    </>
	  );
	  const link = (
	    <Link href={href} title={label} className={linkClassName}>
	      {linkContent}
	    </Link>
	  );
	  if (isDesktopSidebarExpanded) return <React.Fragment key={item.href + item.name}>{link}</React.Fragment>;
	  return (
	    <Tooltip key={item.href + item.name}>
	      <TooltipTrigger asChild>{link}</TooltipTrigger>
	    </Tooltip>
	  );
	})}
      </nav>
      <div className={cn("mt-auto flex flex-col border-t border-[var(--dash-border)] py-3 px-2", "gap-0")}>
	{isDesktopSidebarExpanded ? (
	  <Link href="/dashboard/settings" className="flex items-center h-11 px-3 gap-3 rounded text-[var(--dash-text)] hover:bg-[var(--dash-surface)] hover:text-[var(--dash-text-dim)]">
	    <Settings className="h-[18px] w-[18px] flex-shrink-0" />
	    <span className="text-sm" style={{whiteSpace: "nowrap"}}>Settings</span>
	  </Link>
	) : (
	  <Tooltip>
	    <TooltipTrigger asChild>
	      <Link href="/dashboard/settings" className="flex w-full h-11 px-3 gap-3 items-center rounded text-[var(--dash-text)] hover:bg-[var(--dash-surface)] hover:text-[var(--dash-text-dim)]">
		<Settings className="h-[18px] w-[18px] flex-shrink-0" />
	      </Link>
	    </TooltipTrigger>
	  </Tooltip>
	)}
	<form action="/api/auth/signout" method="POST" className="block" onSubmit={preventDoubleLogoutSubmit}>
	  {isDesktopSidebarExpanded ? (
	    <button type="submit" className="flex w-full h-11 px-3 gap-3 items-center rounded text-[var(--dash-text)] hover:bg-[var(--dash-surface)] hover:text-[var(--dash-text-dim)]">
	      <LogOut className="h-[18px] w-[18px] flex-shrink-0" />
	      <span className="text-sm" style={{whiteSpace: "nowrap"}}>Log out</span>
	    </button>
	  ) : (
	    <Tooltip>
	      <TooltipTrigger asChild>
		<button type="submit" className="flex w-full h-11 px-3 gap-3 items-center rounded text-[var(--dash-text)] hover:bg-[var(--dash-surface)] hover:text-[var(--dash-text-dim)]">
		  <LogOut className="h-[18px] w-[18px] flex-shrink-0" />
		</button>
	      </TooltipTrigger>
	    </Tooltip>
	  )}
	</form>
	{(
	  <div className={cn("flex items-center justify-center rounded-full bg-[var(--dash-border-bright)] text-[13px] font-bold font-dash-condensed text-[var(--dash-text-dim)] mt-2 h-10 w-10 mx-auto")} title={businessName}>
	    {businessName.slice(0, 2).toUpperCase()}
	  </div>
	)}
      </div>
    </aside>
  );
}