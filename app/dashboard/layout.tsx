'use client'

import Link from "next/link";
import React, { useState } from "react";
import { usePathname } from "next/navigation";
import { Barlow, Barlow_Condensed, DM_Mono } from "next/font/google";

const barlow = Barlow({ weight: ["400", "500", "600"], subsets: ["latin"], variable: "--font-barlow", display: "swap" });
const barlowCondensed = Barlow_Condensed({ weight: ["400", "500", "600", "700", "800", "900"], subsets: ["latin"], variable: "--font-barlow-condensed", display: "swap" });
const dmMono = DM_Mono({ weight: ["400", "500"], subsets: ["latin"], variable: "--font-dm-mono", display: "swap" });

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}
import {
  Menu,
  Plus,
  Sparkles,
} from "lucide-react";
import { OpenNewJobProvider } from "@/lib/contexts/open-new-job-context";
import { ThemeToggle } from "@/components/theme-toggle";

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
  "/dashboard/reviews": "Reviews",
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

function Topbar({ onMobileMenuToggle }: { onMobileMenuToggle: () => void }) {
  const pathname = usePathname();
  const title = getPageTitle(pathname);
  const dateStr = formatTopbarDate();

  return (
    <header className="sticky top-0 z-40 h-14 border-b border-[var(--dash-border)] bg-[var(--dash-graphite)] flex items-center justify-between px-6">
      <div className="flex items-center gap-3">
        <button type="button" onClick={onMobileMenuToggle} className="md:hidden flex h-9 w-9 items-center justify-center rounded text-[var(--dash-text)] hover:bg-[var(--dash-surface)]" aria-label="Open menu">
          <Menu className="h-5 w-5" />
        </button>
        <span className="font-dash-condensed font-extrabold text-xl uppercase tracking-wide text-[var(--dash-text)]">{title}</span>
        <span className="font-dash-mono text-[11px] text-[var(--dash-text)] tracking-wider hidden sm:inline">{dateStr}</span>
      </div>
      <div className="flex items-center gap-3">
        <ThemeToggle className="border border-[var(--dash-border)] text-[var(--dash-text)] hover:bg-[var(--dash-surface)] hover:text-[var(--dash-text)] rounded" />
        <Link href="/dashboard/settings/subscription" className="flex items-center gap-1.5 px-2.5 py-1.5 border border-[var(--dash-border)] font-dash-mono text-[10px] uppercase tracking-wider text-[var(--dash-text)] hover:bg-[var(--dash-surface)] hover:text-[var(--dash-text)] transition-colors">
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
import AIAssistant from "@/components/dashboard/ai-assistant";
import { SidebarDesktop, SidebarMobile } from "@/components/dashboard/sidebar";
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
        <SidebarDesktop />
      </div>
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsMobileMenuOpen(false)} aria-hidden />
          <div className="fixed left-0 top-0 bottom-0 w-64 bg-[var(--dash-graphite)] border-r border-[var(--dash-border)] animate-in slide-in-from-left">
            <SidebarMobile isMobile onMobileClose={() => setIsMobileMenuOpen(false)} />
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
      <AIAssistant />
    </div>
    </OpenNewJobProvider>
  );
}

