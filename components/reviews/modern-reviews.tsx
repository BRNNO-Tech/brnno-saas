'use client'

import React, { useMemo, useState } from "react";
import { Star, Send, Clock, Mail, Phone, Settings2, ExternalLink, Search } from "lucide-react";
import Link from "next/link";
import { deleteReviewRequest, updateReviewRequestStatus } from '@/lib/actions/reviews';
import { useRouter } from 'next/navigation';

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function Card({
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
          {subtitle ? <p className="mt-1 text-xs text-zinc-600 dark:text-white/45">{subtitle}</p> : null}
        </div>
        {action}
      </div>
      {children}
    </div>
  );
}

function Stat({ label, value, sub, icon: Icon }: { label: string; value: string; sub: string; icon: any }) {
  return (
    <div className="rounded-3xl border border-zinc-200/50 dark:border-white/10 bg-white/80 dark:bg-white/5 backdrop-blur-sm p-5 shadow-lg dark:shadow-[0_12px_40px_rgba(0,0,0,0.35)]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm text-zinc-700 dark:text-white/65">{label}</p>
          <p className="mt-3 text-3xl font-semibold text-zinc-900 dark:text-white tracking-tight tabular-nums">{value}</p>
          <p className="mt-1 text-xs text-zinc-600 dark:text-white/45">{sub}</p>
        </div>
        <div className="grid h-11 w-11 place-items-center rounded-2xl border border-zinc-200/50 dark:border-white/10 bg-zinc-50/50 dark:bg-white/5">
          <Icon className="h-5 w-5 text-zinc-700 dark:text-white/75" />
        </div>
      </div>
    </div>
  );
}

function Stars({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={cn("h-4 w-4", i < rating ? "text-amber-500 dark:text-amber-300" : "text-zinc-300 dark:text-white/20")}
          fill={i < rating ? "currentColor" : "none"}
        />
      ))}
    </div>
  );
}

function Pill({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full border border-zinc-200/50 dark:border-white/10 bg-zinc-100/50 dark:bg-white/5 px-2 py-0.5 text-xs text-zinc-700 dark:text-white/65">{children}</span>
  );
}

function StatusPill({ status }: { status: "Pending" | "Sent" | "Failed" | "pending" | "sent" | "failed" | "completed" | string }) {
  const normalizedStatus = status.toLowerCase();
  const cls =
    normalizedStatus === "sent" || normalizedStatus === "completed"
      ? "bg-emerald-500/15 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30 dark:border-emerald-500/20"
      : normalizedStatus === "failed"
      ? "bg-rose-500/15 dark:bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30 dark:border-rose-500/20"
      : "bg-amber-500/15 dark:bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30 dark:border-amber-500/20";
  const displayStatus = normalizedStatus === "completed" ? "Sent" : status.charAt(0).toUpperCase() + status.slice(1);
  return <span className={cn("rounded-full border px-2 py-0.5 text-xs", cls)}>{displayStatus}</span>;
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

function formatScheduledDate(date: string | Date): string {
  const d = new Date(date);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const scheduledDate = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  
  const diffDays = Math.floor((scheduledDate.getTime() - today.getTime()) / 86400000);
  
  if (diffDays === 0) return `Today · ${d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`;
  if (diffDays === 1) return `Tomorrow · ${d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`;
  if (diffDays < 7) {
    const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
    return `${dayName} · ${d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`;
  }
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
}

function maskEmail(email: string | null): string {
  if (!email) return "No email";
  const [local, domain] = email.split('@');
  if (!domain) return email;
  const maskedLocal = local.length > 3 ? local.slice(0, 3) + '•'.repeat(3) : local + '•'.repeat(3);
  return `${maskedLocal}@${domain}`;
}

function maskPhone(phone: string | null): string {
  if (!phone) return "No phone";
  // Keep last 4 digits visible
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length < 4) return phone;
  const last4 = cleaned.slice(-4);
  const areaCode = cleaned.length >= 10 ? cleaned.slice(0, 3) : '';
  return areaCode ? `(${areaCode}) •••• ${last4}` : `•••• ${last4}`;
}

type ReviewRequest = {
  id: string;
  status: string;
  send_at: string;
  sent_at: string | null;
  customer_name: string;
  customer_email: string | null;
  customer_phone: string | null;
  review_link: string | null;
  job: { title: string } | null;
  created_at: string;
};

type ReviewStats = {
  avgRating: number;
  totalReviews: number;
  requestsSent: number;
  pendingRequests: number;
  channels: string;
  delay: string;
  platform: string;
};

type ModernReviewsProps = {
  requests: ReviewRequest[];
  stats: ReviewStats;
  recentReviews?: Array<{
    id: string;
    name: string;
    rating: number;
    service: string;
    date: string;
    text: string;
    source: string;
  }>;
};

export default function ModernReviews({ requests, stats, recentReviews = [] }: ModernReviewsProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");

  const pending = useMemo(
    () =>
      requests
        .filter((r) => r.status === 'pending')
        .filter((r) =>
          (r.customer_name + " " + (r.job?.title || "") + " " + (r.customer_email || ""))
            .toLowerCase()
            .includes(query.toLowerCase())
        ),
    [requests, query]
  );

  const recent = useMemo(
    () =>
      recentReviews.filter((r) =>
        (r.name + " " + r.text + " " + r.service).toLowerCase().includes(query.toLowerCase())
      ),
    [recentReviews, query]
  );

  async function handleSendNow(id: string) {
    try {
      await updateReviewRequestStatus(id, 'sent');
      router.refresh();
    } catch (error) {
      console.error('Error sending review request:', error);
      alert('Failed to send review request');
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this review request?')) return;
    try {
      await deleteReviewRequest(id);
      router.refresh();
    } catch (error) {
      console.error('Error deleting review request:', error);
      alert('Failed to delete review request');
    }
  }

  const channelDisplay = stats.channels || "SMS + Email";
  const delayDisplay = stats.delay || "2 hours after job completion";
  const platformDisplay = stats.platform || "Google";

  return (
    <>
      {/* Header */}
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between mb-6">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-zinc-900 dark:text-white">Reviews</h1>
            <p className="mt-1 text-sm text-zinc-600 dark:text-white/55">
              Your reputation hub — performance, automation, and recent feedback.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {stats.platform && (
              <a
                href={stats.platform.startsWith('http') ? stats.platform : `https://${stats.platform}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-2xl border border-zinc-200/50 dark:border-white/10 bg-white/80 dark:bg-white/5 backdrop-blur-sm px-4 py-2 text-sm text-zinc-700 dark:text-white/80 hover:bg-zinc-100 dark:hover:bg-white/10 transition-colors"
              >
                View on {platformDisplay} <ExternalLink className="h-4 w-4 text-zinc-500 dark:text-white/45" />
              </a>
            )}
            <Link href="/dashboard/settings">
              <button className="inline-flex items-center gap-2 rounded-2xl border border-violet-500/30 dark:border-violet-500/30 bg-violet-500/10 dark:bg-violet-500/15 px-4 py-2 text-sm font-medium text-violet-700 dark:text-violet-200 hover:bg-violet-500/20 dark:hover:bg-violet-500/20 transition-colors">
                <Settings2 className="h-4 w-4" /> Review Settings
              </button>
            </Link>
          </div>
        </div>

      {/* Search */}
      <div className="mb-6 flex items-center gap-3 rounded-3xl border border-zinc-200/50 dark:border-white/10 bg-white/80 dark:bg-white/5 backdrop-blur-sm px-4 py-3">
          <Search className="h-4 w-4 text-zinc-500 dark:text-white/45" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search reviews, customers, jobs..."
            className="w-full bg-transparent text-sm text-zinc-900 dark:text-white placeholder:text-zinc-500 dark:placeholder:text-white/35 outline-none"
          />
        </div>

      {/* KPI Row */}
      <div className="mb-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Stat label="Average Rating" value={stats.avgRating.toFixed(1)} sub="Last 90 days" icon={Star} />
          <Stat label="Total Reviews" value={String(stats.totalReviews)} sub="All-time" icon={Star} />
          <Stat label="Requests Sent" value={String(stats.requestsSent)} sub="Automation volume" icon={Send} />
          <Stat label="Pending Requests" value={String(stats.pendingRequests)} sub="Needs attention" icon={Clock} />
        </div>

      {/* Automation + Pending */}
      <div className="mb-6 grid gap-4 lg:grid-cols-3">
          <Card
            title="Review Automation"
            subtitle="Turn completed jobs into 5-star reviews"
            action={
              <Link href="/dashboard/settings">
                <button className="rounded-2xl border border-violet-500/30 dark:border-violet-500/30 bg-violet-500/10 dark:bg-violet-500/15 px-3 py-1.5 text-xs font-medium text-violet-700 dark:text-violet-200 hover:bg-violet-500/20 dark:hover:bg-violet-500/20 transition-colors">
                  Adjust
                </button>
              </Link>
            }
          >
            <div className="space-y-3">
              <div className="rounded-2xl border border-zinc-200/50 dark:border-white/10 bg-zinc-50/50 dark:bg-black/20 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-zinc-900 dark:text-white">Active</p>
                    <p className="mt-1 text-xs text-zinc-600 dark:text-white/55">Sends {delayDisplay}</p>
                    <div className="mt-3 grid gap-2">
                      <div className="flex items-center justify-between rounded-2xl border border-zinc-200/50 dark:border-white/10 bg-white/80 dark:bg-white/5 px-4 py-3">
                        <p className="text-sm text-zinc-700 dark:text-white/75">Channels</p>
                        <div className="flex flex-col items-end gap-0.5">
                          {channelDisplay.includes('+') ? (
                            <>
                              <p className="text-sm font-semibold text-zinc-900 dark:text-white leading-tight">SMS +</p>
                              <p className="text-sm font-semibold text-zinc-900 dark:text-white leading-tight">Email</p>
                            </>
                          ) : (
                            <p className="text-sm font-semibold text-zinc-900 dark:text-white">{channelDisplay}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center justify-between rounded-2xl border border-zinc-200/50 dark:border-white/10 bg-white/80 dark:bg-white/5 px-4 py-3">
                        <p className="text-sm text-zinc-700 dark:text-white/75">Platform</p>
                        <div className="flex flex-col items-end gap-0.5">
                          {platformDisplay.includes(' ') ? (
                            <>
                              <p className="text-sm font-semibold text-zinc-900 dark:text-white leading-tight">{platformDisplay.split(' ')[0]}</p>
                              <p className="text-sm font-semibold text-zinc-900 dark:text-white leading-tight">{platformDisplay.split(' ').slice(1).join(' ')}</p>
                            </>
                          ) : (
                            <p className="text-sm font-semibold text-zinc-900 dark:text-white">{platformDisplay}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="grid h-11 w-11 place-items-center rounded-2xl bg-emerald-500/15 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 ring-1 ring-emerald-500/20 dark:ring-emerald-500/20">
                    <Star className="h-5 w-5" />
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-zinc-200/50 dark:border-white/10 bg-gradient-to-br from-zinc-50/50 dark:from-white/5 to-transparent p-4">
                <p className="text-sm font-medium text-zinc-900 dark:text-white">BRNNO Insight</p>
                <p className="mt-1 text-xs text-zinc-600 dark:text-white/55">
                  Sending within 2–4 hours of completion typically improves response rate.
                </p>
                <Link href="/dashboard/settings">
                  <button className="mt-3 w-full rounded-2xl border border-zinc-200/50 dark:border-white/10 bg-white/80 dark:bg-white/5 px-4 py-2 text-sm text-zinc-700 dark:text-white/80 hover:bg-zinc-100 dark:hover:bg-white/10 transition-colors">
                    Optimize timing
                  </button>
                </Link>
              </div>
            </div>
          </Card>

          <div className="lg:col-span-2">
            <Card
              title={`Pending Requests (${pending.length})`}
              subtitle="Queued to send — intervene if needed"
              action={
                <Link href="/dashboard/reviews">
                  <button className="rounded-2xl border border-zinc-200/50 dark:border-white/10 bg-white/80 dark:bg-white/5 backdrop-blur-sm px-3 py-1.5 text-xs text-zinc-700 dark:text-white/70 hover:bg-zinc-100 dark:hover:bg-white/10 transition-colors">
                    View all
                  </button>
                </Link>
              }
            >
              <div className="space-y-3">
                {pending.map((r) => (
                  <div
                    key={r.id}
                    className="flex flex-col gap-3 rounded-3xl border border-zinc-200/50 dark:border-white/10 bg-zinc-50/50 dark:bg-black/20 p-4 hover:bg-zinc-100 dark:hover:bg-white/5 transition-colors md:flex-row md:items-center md:justify-between"
                  >
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-semibold text-zinc-900 dark:text-white">{r.customer_name}</p>
                        <StatusPill status={r.status as any} />
                        <Pill>{channelDisplay}</Pill>
                      </div>
                      <p className="mt-1 text-xs text-zinc-600 dark:text-white/55">{r.job?.title || "Job"}</p>

                      <div className="mt-3 grid gap-2 sm:grid-cols-2">
                        <div className="flex items-center gap-2 rounded-2xl border border-zinc-200/50 dark:border-white/10 bg-white/80 dark:bg-white/5 px-3 py-2 text-xs text-zinc-700 dark:text-white/70">
                          <Clock className="h-4 w-4 text-zinc-500 dark:text-white/45" /> Scheduled: <span className="text-zinc-900 dark:text-white/85">{formatScheduledDate(r.send_at)}</span>
                        </div>
                        {r.customer_phone && (
                          <div className="flex items-center gap-2 rounded-2xl border border-zinc-200/50 dark:border-white/10 bg-white/80 dark:bg-white/5 px-3 py-2 text-xs text-zinc-700 dark:text-white/70">
                            <Phone className="h-4 w-4 text-zinc-500 dark:text-white/45" /> {maskPhone(r.customer_phone)}
                          </div>
                        )}
                        {r.customer_email && (
                          <div className="flex items-center gap-2 rounded-2xl border border-zinc-200/50 dark:border-white/10 bg-white/80 dark:bg-white/5 px-3 py-2 text-xs text-zinc-700 dark:text-white/70 sm:col-span-2">
                            <Mail className="h-4 w-4 text-zinc-500 dark:text-white/45" /> {maskEmail(r.customer_email)}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleSendNow(r.id)}
                        className="rounded-2xl border border-violet-500/30 dark:border-violet-500/30 bg-violet-500/10 dark:bg-violet-500/15 px-4 py-2 text-sm font-medium text-violet-700 dark:text-violet-200 hover:bg-violet-500/20 dark:hover:bg-violet-500/20 transition-colors"
                      >
                        Send now
                      </button>
                      <button
                        onClick={() => handleDelete(r.id)}
                        className="rounded-2xl border border-zinc-200/50 dark:border-white/10 bg-white/80 dark:bg-white/5 backdrop-blur-sm px-3 py-2 text-zinc-700 dark:text-white/70 hover:bg-zinc-100 dark:hover:bg-white/10 transition-colors"
                      >
                        🗑
                      </button>
                    </div>
                  </div>
                ))}

                {pending.length === 0 ? (
                  <div className="rounded-3xl border border-zinc-200/50 dark:border-white/10 bg-zinc-50/50 dark:bg-black/20 p-6 text-center">
                    <p className="text-sm font-medium text-zinc-900 dark:text-white">No pending requests</p>
                    <p className="mt-1 text-xs text-zinc-600 dark:text-white/50">Automation is running smoothly.</p>
                  </div>
                ) : null}
              </div>
            </Card>
          </div>
        </div>

      {/* Recent Reviews */}
      {recentReviews.length > 0 && (
        <div className="mb-6">
            <Card
              title="Recent Reviews"
              subtitle="Latest feedback from customers"
              action={
                <button className="rounded-2xl border border-zinc-200/50 dark:border-white/10 bg-white/80 dark:bg-white/5 backdrop-blur-sm px-3 py-1.5 text-xs text-zinc-700 dark:text-white/70 hover:bg-zinc-100 dark:hover:bg-white/10 transition-colors">
                  Export
                </button>
              }
            >
              <div className="grid gap-3 lg:grid-cols-2">
                {recent.map((r) => (
                  <div key={r.id} className="rounded-3xl border border-zinc-200/50 dark:border-white/10 bg-zinc-50/50 dark:bg-black/20 p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-zinc-900 dark:text-white">{r.name}</p>
                        <p className="mt-1 text-xs text-zinc-600 dark:text-white/50">{r.service}</p>
                      </div>
                      <div className="text-right">
                        <Stars rating={r.rating} />
                        <p className="mt-1 text-xs text-zinc-600 dark:text-white/45">{r.date} · {r.source}</p>
                      </div>
                    </div>
                    <p className="mt-4 text-sm text-zinc-700 dark:text-white/75 leading-relaxed">{r.text}</p>
                  </div>
                ))}

                {recent.length === 0 ? (
                  <div className="rounded-3xl border border-zinc-200/50 dark:border-white/10 bg-zinc-50/50 dark:bg-black/20 p-6 text-center lg:col-span-2">
                    <p className="text-sm font-medium text-zinc-900 dark:text-white">No reviews found</p>
                    <p className="mt-1 text-xs text-zinc-600 dark:text-white/50">Try adjusting your search.</p>
                  </div>
                ) : null}
              </div>
            </Card>
          </div>
        )}

      <footer className="mt-10 pb-6 text-center text-xs text-zinc-500 dark:text-white/35">BRNNO — Reviews UI v1</footer>
    </>
  );
}
