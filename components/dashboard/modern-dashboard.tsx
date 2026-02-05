'use client'

import React, { useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  LayoutGrid,
  Users,
  Briefcase,
  FileText,
  DollarSign,
  Bell,
  Search,
  Settings,
  LogOut,
  MessageSquare,
  Wrench,
  BarChart3,
  ChevronDown,
  ChevronRight,
  Sparkles,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { MileageWidget } from '@/components/mileage/mileage-widget';
import { DashboardPhotosWidget } from './dashboard-photos-widget';
import { DashboardWeatherWidget } from './dashboard-weather-widget';

const currency = (n: number) =>
  n.toLocaleString(undefined, { style: "currency", currency: "USD" });

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function GlowBG() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute -top-40 left-1/2 h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-violet-500/10 blur-3xl" />
      <div className="absolute top-32 -left-24 h-[520px] w-[520px] rounded-full bg-cyan-500/10 blur-3xl" />
      <div className="absolute bottom-[-180px] right-[-120px] h-[520px] w-[520px] rounded-full bg-emerald-500/10 blur-3xl" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(255,255,255,0.06),transparent_55%)]" />
    </div>
  );
}

function SidebarItem({
  icon: Icon,
  label,
  active,
  badge,
  href,
}: {
  icon: any;
  label: string;
  active?: boolean;
  badge?: string;
  href?: string;
}) {
  const content = (
    <button
      className={cn(
        "group flex w-full items-center justify-between rounded-xl px-3 py-2 text-sm transition",
        "hover:bg-zinc-100/50 dark:hover:bg-white/5",
        active &&
          "bg-gradient-to-r from-violet-500/15 to-transparent ring-1 ring-violet-500/25"
      )}
    >
      <span className="flex items-center gap-3">
        <span
          className={cn(
            "grid h-9 w-9 place-items-center rounded-xl border border-zinc-200/50 dark:border-white/10 bg-zinc-50/50 dark:bg-white/5",
            active &&
              "border-violet-500/25 dark:border-violet-500/25 bg-violet-500/10 dark:bg-violet-500/10 shadow-[0_0_0_1px_rgba(139,92,246,0.2)]"
          )}
        >
          <Icon className={cn("h-4 w-4 text-zinc-700 dark:text-white/70", active && "text-violet-600 dark:text-violet-300")} />
        </span>
        <span className={cn("text-zinc-700 dark:text-white/75", active && "text-zinc-900 dark:text-white")}>{label}</span>
      </span>

      {badge ? (
        <span className="rounded-full bg-amber-500/15 dark:bg-amber-500/15 px-2 py-0.5 text-xs text-amber-700 dark:text-amber-300">
          {badge}
        </span>
      ) : null}
    </button>
  );

  if (href) {
    return <Link href={href}>{content}</Link>;
  }
  return content;
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-2 flex items-center gap-2">
      <span className="text-[11px] font-medium uppercase tracking-wider text-zinc-500 dark:text-white/35">
        {children}
      </span>
      <span className="h-px flex-1 bg-zinc-200/50 dark:bg-white/10" />
    </div>
  );
}

function TopBar({
  businessName,
}: {
  businessName: string;
}) {
  return (
    <header className="sticky top-0 z-30 border-b border-zinc-200/50 dark:border-white/10 bg-white/80 dark:bg-black/30 backdrop-blur-xl">
      <div className="flex items-center justify-between px-6 py-3">
        <div className="flex items-center gap-4">
          <div className="flex flex-col">
            <span className="text-sm text-zinc-500 dark:text-white/45">BRNNO</span>
            <span className="text-lg font-semibold text-zinc-900 dark:text-white">
              {businessName}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative hidden md:block">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500 dark:text-white/45" />
            <input
              placeholder="Search clients, jobs..."
              className="w-[340px] rounded-2xl border border-zinc-200/50 dark:border-white/10 bg-white/80 dark:bg-white/5 py-2 pl-10 pr-3 text-sm text-zinc-900 dark:text-white placeholder:text-zinc-500 dark:placeholder:text-white/35 outline-none transition focus:border-violet-500/30 dark:focus:border-violet-500/30 focus:ring-2 focus:ring-violet-500/15 dark:focus:ring-violet-500/15"
            />
          </div>

          <Link href="/dashboard/settings">
            <button className="grid h-10 w-10 place-items-center rounded-2xl border border-zinc-200/50 dark:border-white/10 bg-white/50 dark:bg-white/5 text-zinc-600 dark:text-white/70 hover:bg-zinc-100 dark:hover:bg-white/10 transition-colors">
              <Settings className="h-4 w-4" />
            </button>
          </Link>
        </div>
      </div>
    </header>
  );
}

function KpiCard({
  title,
  value,
  sub,
  trend,
  trendDir,
  icon: Icon,
  tone,
}: {
  title: string;
  value: string;
  sub: string;
  trend?: string;
  trendDir?: "up" | "down";
  icon: any;
  tone: "violet" | "amber" | "cyan" | "emerald";
}) {
  const toneMap: Record<string, string> = {
    violet: "from-violet-500/18 dark:from-violet-500/18 to-violet-500/5 dark:to-violet-500/5 ring-violet-500/20 dark:ring-violet-500/20",
    amber: "from-amber-500/18 dark:from-amber-500/18 to-amber-500/5 dark:to-amber-500/5 ring-amber-500/20 dark:ring-amber-500/20",
    cyan: "from-cyan-500/18 dark:from-cyan-500/18 to-cyan-500/5 dark:to-cyan-500/5 ring-cyan-500/20 dark:ring-cyan-500/20",
    emerald: "from-emerald-500/18 dark:from-emerald-500/18 to-emerald-500/5 dark:to-emerald-500/5 ring-emerald-500/20 dark:ring-emerald-500/20",
  };

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-3xl border border-zinc-200/50 dark:border-white/10 bg-white/80 dark:bg-white/5 backdrop-blur-sm bg-gradient-to-br p-5",
        "shadow-lg dark:shadow-[0_10px_30px_rgba(0,0,0,0.35)]",
        "transition hover:-translate-y-0.5 hover:bg-zinc-50 dark:hover:bg-white/6",
        "ring-1",
        toneMap[tone]
      )}
    >
      <div className="absolute -right-10 -top-12 h-40 w-40 rounded-full bg-zinc-100/50 dark:bg-white/5 blur-2xl" />

      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm text-zinc-700 dark:text-white/65">{title}</p>
          <p className="mt-3 text-3xl font-semibold text-zinc-900 dark:text-white tracking-tight">
            {value}
          </p>
          <p className="mt-1 text-xs text-zinc-600 dark:text-white/45">{sub}</p>
        </div>

        <div className="flex flex-col items-end gap-2">
          <div className="grid h-11 w-11 place-items-center rounded-2xl border border-zinc-200/50 dark:border-white/10 bg-zinc-50/50 dark:bg-white/5">
            <Icon className="h-5 w-5 text-zinc-700 dark:text-white/75" />
          </div>

          {trend ? (
            <div
              className={cn(
                "inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs",
                trendDir === "down"
                  ? "bg-rose-500/15 dark:bg-rose-500/15 text-rose-700 dark:text-rose-300"
                  : "bg-emerald-500/15 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
              )}
            >
              {trendDir === "down" ? (
                <ArrowDownRight className="h-3.5 w-3.5" />
              ) : (
                <ArrowUpRight className="h-3.5 w-3.5" />
              )}
              {trend}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function CardShell({
  title,
  subtitle,
  action,
  children,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-3xl border border-zinc-200/50 dark:border-white/10 bg-white/80 dark:bg-white/5 backdrop-blur-sm p-5 shadow-lg dark:shadow-[0_12px_40px_rgba(0,0,0,0.35)]">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-white">{title}</h3>
          {subtitle ? (
            <p className="mt-1 text-xs text-zinc-600 dark:text-white/45">{subtitle}</p>
          ) : null}
        </div>
        {action}
      </div>
      {children}
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  const s = status.toLowerCase();
  const cls =
    s === "overdue"
      ? "bg-rose-500/15 dark:bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30 dark:border-rose-500/20"
      : s === "confirmed" || s === "paid"
      ? "bg-emerald-500/15 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30 dark:border-emerald-500/20"
      : s === "scheduled" || s === "in_progress"
      ? "bg-cyan-500/15 dark:bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 border-cyan-500/30 dark:border-cyan-500/20"
      : "bg-amber-500/15 dark:bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30 dark:border-amber-500/20";
  return (
    <span className={cn("rounded-full border px-2 py-0.5 text-xs", cls)}>
      {status}
    </span>
  );
}

function ActivityIcon({ kind }: { kind: string }) {
  const common = "h-4 w-4";
  if (kind === "job") return <Briefcase className={common} />;
  if (kind === "client") return <Users className={common} />;
  return <DollarSign className={common} />;
}

function formatTimeAgo(date: string | Date): string {
  const now = new Date();
  const then = new Date(date);
  const diffMs = now.getTime() - then.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return then.toLocaleDateString();
}

function formatJobDate(date: string | Date): string {
  const d = new Date(date);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const jobDate = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  
  const diffDays = Math.floor((jobDate.getTime() - today.getTime()) / 86400000);
  
  if (diffDays === 0) return `Today · ${d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`;
  if (diffDays === 1) return `Tomorrow · ${d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`;
  if (diffDays < 7) {
    const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
    return `${dayName} · ${d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`;
  }
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
}


type DashboardData = {
  stats: {
    totalClients: number;
    activeJobs: number;
    revenueMTD: number;
    recentActivity: any[];
  };
  monthlyRevenue: Array<{ name: string; total: number }>;
  upcomingJobs: any[];
  businessName: string;
  businessAddress?: string | null;
  mileageSummary?: {
    today: { miles: number; deduction: number };
    thisWeek: { miles: number; deduction: number };
    thisMonth: { miles: number; deduction: number };
    thisYear: { miles: number; deduction: number };
  } | null;
  photos?: {
    customerPhotos: Array<{
      id: string;
      storage_url: string;
      uploaded_at: string;
      source: 'customer';
      job_id: string;
      job_title?: string;
      photo_type: string;
      ai_analysis?: any;
      ai_processed?: boolean;
    }>;
    workerPhotos: Array<{
      id: string;
      storage_url: string;
      uploaded_at: string;
      source: 'worker';
      job_id: string;
      job_title?: string;
      photo_type: string;
      ai_analysis?: any;
      ai_processed?: boolean;
    }>;
    totalCount: number;
  } | null;
};

export default function ModernDashboard({
  stats,
  monthlyRevenue,
  upcomingJobs,
  businessName,
  businessAddress = null,
  mileageSummary,
  photos,
}: DashboardData) {
  const router = useRouter();

  // Safe defaults so useMemo never throws (avoids React "rendered more hooks" #310 when props are undefined on first render)
  const safeStats = stats ?? { totalClients: 0, activeJobs: 0, revenueMTD: 0, pendingInvoices: 0, recentActivity: [] };
  const safeMonthlyRevenue = Array.isArray(monthlyRevenue) ? monthlyRevenue : [];

  // Get last 12 months of revenue data
  const revenueData = useMemo(() => {
    const monthNames = ["Aug", "Sep", "Oct", "Nov", "Dec", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul"];
    const now = new Date();
    const data: Array<{ month: string; revenue: number }> = [];
    
    // Get last 12 months
    for (let i = 11; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthKey = monthNames[date.getMonth()];
      const existing = safeMonthlyRevenue.find(m => m.name === monthKey);
      data.push({
        month: monthKey,
        revenue: existing?.total || 0,
      });
    }
    return data;
  }, [safeMonthlyRevenue]);

  const recentActivity = useMemo(() => {
    return (safeStats.recentActivity ?? []).slice(0, 4).map((activity: any) => {
      let icon = "payment";
      let title = "";
      let meta = "";

      if (activity.type === "job") {
        icon = "job";
        title = "Job completed";
        meta = activity.title || "Job";
      } else if (activity.type === "client") {
        icon = "client";
        title = "New customer added";
        meta = activity.name || "Customer";
      }

      return {
        icon,
        title,
        meta,
        time: formatTimeAgo(activity.date),
      };
    }).filter((a: any) => a.title); // Filter out any empty activities
  }, [safeStats.recentActivity]);

  return (
    <div className="relative w-full">
      <div className="hidden dark:block absolute inset-0 pointer-events-none">
        <GlowBG />
      </div>

      <div className="relative">
        {/* Sidebar - Hidden since layout provides its own */}
        <aside className="hidden">
            <div className="px-5 py-5">
              <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-violet-500/40 to-cyan-500/20 ring-1 ring-zinc-200/50 dark:ring-white/10">
                      <Sparkles className="h-5 w-5 text-zinc-700 dark:text-white" />
                    </div>
                    <div>
                      <p className="text-xs text-zinc-500 dark:text-white/45">BRNNO</p>
                      <p className="text-sm font-semibold text-zinc-900 dark:text-white">{businessName}</p>
                    </div>
                  </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-4 pb-6">
              <SidebarItem icon={LayoutGrid} label="Dashboard" active href="/dashboard" />

              <div className="mt-6">
                <SectionLabel>Sales</SectionLabel>
                <div className="space-y-1">
                  <SidebarItem icon={Users} label="Leads" href="/dashboard/leads" />
                  <SidebarItem icon={FileText} label="Quotes" href="/dashboard/quotes" />
                </div>
              </div>

              <div className="mt-6">
                <SectionLabel>Customers</SectionLabel>
                <div className="space-y-1">
                  <SidebarItem icon={Users} label="Customers" href="/dashboard/customers" />
                  <SidebarItem icon={Briefcase} label="Jobs" href="/dashboard/jobs" />
                </div>
              </div>

              <div className="mt-6">
                <SectionLabel>Finance</SectionLabel>
                <div className="space-y-1">
                </div>
              </div>

              <div className="mt-6">
                <SectionLabel>Business</SectionLabel>
                <div className="space-y-1">
                  <SidebarItem icon={Wrench} label="Services" href="/dashboard/services" />
                  <SidebarItem icon={Settings} label="Settings" href="/dashboard/settings" />
                </div>
              </div>

              <div className="mt-8">
                <SectionLabel>Account</SectionLabel>
                <div className="space-y-1">
                  <SidebarItem icon={Settings} label="Settings" href="/dashboard/settings" />
                  <SidebarItem icon={LogOut} label="Logout" href="/api/auth/signout" />
                </div>
              </div>
            </div>
          </aside>

          {/* Main */}
          <main className="flex-1 w-full">
            <div className="mx-auto max-w-[1280px]">
              {/* Header */}
              <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
                <div>
                  <h1 className="text-3xl font-semibold tracking-tight text-zinc-900 dark:text-white">Dashboard</h1>
                  <p className="mt-1 text-sm text-zinc-600 dark:text-white/55">
                    Your snapshot for today — revenue, jobs, and what needs attention.
                  </p>
                </div>

              </div>

              {/* KPI Row */}
              <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <KpiCard
                  title="Revenue (MTD)"
                  value={currency(safeStats.revenueMTD)}
                  sub="vs last month"
                  trend="+12%"
                  trendDir="up"
                  icon={DollarSign}
                  tone="emerald"
                />
                <KpiCard
                  title="Active Jobs"
                  value={String(safeStats.activeJobs)}
                  sub="In progress / scheduled"
                  trend={safeStats.activeJobs > 0 ? "+1" : undefined}
                  trendDir="up"
                  icon={Briefcase}
                  tone="amber"
                />
                <KpiCard
                  title="Total Clients"
                  value={String(safeStats.totalClients)}
                  sub="All-time"
                  icon={Users}
                  tone="violet"
                />
                <KpiCard
                  title="Upcoming Jobs"
                  value={String(upcomingJobs.length)}
                  sub="Scheduled this week"
                  icon={Calendar}
                  tone="cyan"
                />
              </div>

              {/* Three-up: Revenue + View Reports below | Weather + Upcoming + Mileage */}
              <div className="mt-6 grid gap-4 lg:grid-cols-3">
                <div className="lg:col-span-2 space-y-4">
                  <CardShell
                    title="Revenue Overview"
                    subtitle="Last 12 months"
                    action={
                      <Link href="/dashboard/reports">
                        <button className="rounded-2xl border border-zinc-200/50 dark:border-white/10 bg-white/80 dark:bg-white/5 backdrop-blur-sm px-3 py-1.5 text-xs text-zinc-700 dark:text-white/70 hover:bg-zinc-100 dark:hover:bg-white/10 transition-colors">
                          Export
                        </button>
                      </Link>
                    }
                  >
                    <div className="h-[280px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={revenueData} margin={{ left: 0, right: 0, top: 10 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.1)" className="dark:stroke-white/8" />
                          <XAxis
                            dataKey="month"
                            tick={{ fill: "rgb(63,63,70)", fontSize: 12 }}
                            className="dark:[&_text]:fill-white/55 dark:[&_line]:stroke-white/10"
                            axisLine={{ stroke: "rgba(0,0,0,0.1)" }}
                            tickLine={{ stroke: "rgba(0,0,0,0.1)" }}
                          />
                          <YAxis
                            tick={{ fill: "rgb(63,63,70)", fontSize: 12 }}
                            className="dark:[&_text]:fill-white/55 dark:[&_line]:stroke-white/10"
                            axisLine={{ stroke: "rgba(0,0,0,0.1)" }}
                            tickLine={{ stroke: "rgba(0,0,0,0.1)" }}
                          />
                          <Tooltip
                            contentStyle={{
                              background: "rgba(255,255,255,0.95)",
                              border: "1px solid rgba(0,0,0,0.1)",
                              borderRadius: 16,
                              color: "rgb(24,24,27)",
                            }}
                            formatter={(v: any) => currency(Number(v))}
                            labelStyle={{ color: "rgb(24,24,27)" }}
                          />
                          <Bar
                            dataKey="revenue"
                            radius={[12, 12, 12, 12]}
                            fill="rgba(99,102,241,0.65)"
                            className="dark:fill-[rgba(99,102,241,0.65)]"
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardShell>

                  <Link href="/dashboard/reports">
                    <div className="group relative overflow-hidden rounded-3xl border border-violet-500/30 dark:border-violet-500/30 bg-gradient-to-br from-violet-500/15 dark:from-violet-500/15 via-violet-500/10 dark:via-violet-500/10 to-purple-500/5 dark:to-purple-500/5 backdrop-blur-sm p-5 shadow-lg dark:shadow-[0_12px_40px_rgba(139,92,246,0.25)] hover:shadow-xl dark:hover:shadow-[0_16px_50px_rgba(139,92,246,0.35)] transition-all duration-300 hover:-translate-y-0.5 cursor-pointer">
                      <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-violet-500/20 dark:bg-violet-500/30 blur-2xl group-hover:bg-violet-500/30 dark:group-hover:bg-violet-500/40 transition-all duration-500" />
                      <div className="absolute -left-8 -bottom-8 h-24 w-24 rounded-full bg-purple-500/15 dark:bg-purple-500/20 blur-xl group-hover:bg-purple-500/25 dark:group-hover:bg-purple-500/30 transition-all duration-500" />
                      <div className="relative flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <div className="grid h-10 w-10 place-items-center rounded-2xl bg-gradient-to-br from-violet-500/20 dark:from-violet-500/25 to-purple-500/15 dark:to-purple-500/20 border border-violet-500/30 dark:border-violet-500/30">
                            <BarChart3 className="h-5 w-5 text-violet-600 dark:text-violet-300" />
                          </div>
                          <div>
                            <h3 className="text-base font-semibold text-zinc-900 dark:text-white">View Reports</h3>
                            <p className="text-sm text-zinc-600 dark:text-white/60">Analytics, insights & performance metrics</p>
                          </div>
                        </div>
                        <ArrowUpRight className="h-5 w-5 text-violet-600 dark:text-violet-300 opacity-0 group-hover:opacity-100 transition-opacity duration-300 shrink-0" />
                      </div>
                    </div>
                  </Link>
                </div>

                <div className="space-y-4">
                  <DashboardWeatherWidget businessAddress={businessAddress} />
                  <CardShell
                    title="Upcoming Jobs"
                    subtitle="Next scheduled visits"
                    action={
                      <Link href="/dashboard/jobs">
                        <button className="rounded-2xl border border-zinc-200/50 dark:border-white/10 bg-white/80 dark:bg-white/5 backdrop-blur-sm px-3 py-1.5 text-xs text-zinc-700 dark:text-white/70 hover:bg-zinc-100 dark:hover:bg-white/10 transition-colors">
                          Open Jobs
                        </button>
                      </Link>
                    }
                  >
                    <div className="space-y-3">
                      {upcomingJobs.length === 0 ? (
                        <p className="text-sm text-zinc-600 dark:text-white/50 text-center py-4">No upcoming jobs</p>
                      ) : (
                        upcomingJobs.slice(0, 2).map((j) => (
                          <Link key={j.id} href={`/dashboard/jobs`}>
                            <div className="flex items-start justify-between gap-3 rounded-2xl border border-zinc-200/50 dark:border-white/10 bg-zinc-50/50 dark:bg-black/20 p-4 hover:bg-zinc-100 dark:hover:bg-white/5 cursor-pointer transition-colors">
                              <div className="min-w-0">
                                <div className="flex flex-wrap items-center gap-2">
                                  <p className="text-sm font-medium text-zinc-900 dark:text-white">
                                    {j.title || j.service_type || "Job"}
                                  </p>
                                  <StatusPill status={j.status} />
                                </div>
                                <p className="mt-1 text-xs text-zinc-600 dark:text-white/50">
                                  {j.client?.name || "Client"} · {j.service_type || "Service"}
                                </p>
                                <p className="mt-3 text-xs text-zinc-600 dark:text-white/60">
                                  {j.scheduled_date ? formatJobDate(j.scheduled_date) : "Not scheduled"}
                                </p>
                              </div>
                            </div>
                          </Link>
                        ))
                      )}
                    </div>
                  </CardShell>

                  {/* Mileage Widget - Only show if user has subscription add-on */}
                  {mileageSummary && (
                    <Link href="/dashboard/mileage" className="block mt-6">
                      <div className="group">
                        <MileageWidget summary={mileageSummary} />
                      </div>
                    </Link>
                  )}
                </div>
              </div>

              {/* Bottom grid: Activity + Jobs + Insights */}
              <div className="mt-6 grid gap-4 lg:grid-cols-2">
                <CardShell
                  title="Recent Activity"
                  subtitle="Latest changes across your workspace"
                  action={
                    <Link href="/dashboard">
                      <button className="rounded-2xl border border-zinc-200/50 dark:border-white/10 bg-white/80 dark:bg-white/5 backdrop-blur-sm px-3 py-1.5 text-xs text-zinc-700 dark:text-white/70 hover:bg-zinc-100 dark:hover:bg-white/10 transition-colors">
                        View all
                      </button>
                    </Link>
                  }
                >
                  <div className="space-y-3">
                    {recentActivity.length === 0 ? (
                      <p className="text-sm text-zinc-600 dark:text-white/50 text-center py-4">No recent activity</p>
                    ) : (
                      recentActivity.map((a, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between gap-3 rounded-2xl border border-zinc-200/50 dark:border-white/10 bg-zinc-50/50 dark:bg-black/20 p-4"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="grid h-10 w-10 place-items-center rounded-2xl border border-zinc-200/50 dark:border-white/10 bg-white/80 dark:bg-white/5 text-zinc-700 dark:text-white/70">
                              <ActivityIcon kind={a.icon} />
                            </div>
                            <div className="min-w-0">
                              <p className="truncate text-sm font-medium text-zinc-900 dark:text-white">
                                {a.title}
                              </p>
                              <p className="truncate text-xs text-zinc-600 dark:text-white/50">{a.meta}</p>
                            </div>
                          </div>
                          <p className="shrink-0 text-xs text-zinc-600 dark:text-white/45">{a.time}</p>
                        </div>
                      ))
                    )}
                  </div>
                </CardShell>

                <CardShell
                  title="Business Insights"
                  subtitle="Performance & growth metrics"
                  action={
                    <Link href="/dashboard/reports">
                      <button className="rounded-2xl border border-zinc-200/50 dark:border-white/10 bg-white/80 dark:bg-white/5 backdrop-blur-sm px-3 py-1.5 text-xs text-zinc-700 dark:text-white/70 hover:bg-zinc-100 dark:hover:bg-white/10 transition-colors">
                        View Reports
                      </button>
                    </Link>
                  }
                >
                  <div className="space-y-4">
                    <div className="rounded-2xl border border-zinc-200/50 dark:border-white/10 bg-zinc-50/50 dark:bg-black/20 px-4 py-3">
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-zinc-700 dark:text-white/80">Monthly Revenue</p>
                        <p className="text-sm font-semibold text-zinc-900 dark:text-white">
                          {currency(safeStats.revenueMTD)}
                        </p>
                      </div>
                    </div>
                    <div className="rounded-2xl border border-zinc-200/50 dark:border-white/10 bg-zinc-50/50 dark:bg-black/20 px-4 py-3">
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-zinc-700 dark:text-white/80">Active Jobs</p>
                        <p className="text-sm font-semibold text-zinc-900 dark:text-white">
                          {safeStats.activeJobs}
                        </p>
                      </div>
                    </div>
                    <div className="rounded-2xl border border-zinc-200/50 dark:border-white/10 bg-zinc-50/50 dark:bg-black/20 px-4 py-3">
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-zinc-700 dark:text-white/80">Total Clients</p>
                        <p className="text-sm font-semibold text-zinc-900 dark:text-white">
                          {safeStats.totalClients}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 rounded-2xl border border-zinc-200/50 dark:border-white/10 bg-gradient-to-br from-emerald-500/10 dark:from-emerald-500/10 to-transparent p-4">
                    <p className="text-sm font-medium text-zinc-900 dark:text-white">BRNNO Insight</p>
                    <p className="mt-1 text-xs text-zinc-600 dark:text-white/55">
                      Keep your schedule updated to maximize revenue and customer satisfaction.
                    </p>
                    <Link href="/dashboard/schedule">
                      <button className="mt-3 w-full rounded-2xl border border-zinc-200/50 dark:border-white/10 bg-white/80 dark:bg-white/5 backdrop-blur-sm px-4 py-2 text-sm text-zinc-700 dark:text-white/80 hover:bg-zinc-100 dark:hover:bg-white/10 transition-colors">
                        View Calendar
                      </button>
                    </Link>
                  </div>
                </CardShell>
              </div>

              {/* Photos Section */}
              {photos && (
                <div className="mt-6">
                  <DashboardPhotosWidget
                    customerPhotos={photos.customerPhotos}
                    workerPhotos={photos.workerPhotos}
                    totalCount={photos.totalCount}
                  />
                </div>
              )}

              <footer className="mt-10 pb-6 text-center text-xs text-zinc-500 dark:text-white/35">
                BRNNO · {businessName} — Dashboard UI v2
              </footer>
            </div>
          </main>
        </div>
    </div>
  );
}
