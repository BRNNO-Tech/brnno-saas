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
    <div className="border border-[var(--dash-border)] bg-[var(--dash-graphite)] p-5">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <h3 className="font-dash-condensed font-bold text-[var(--dash-text)]">{title}</h3>
          {subtitle ? <p className="mt-0.5 font-dash-mono text-[11px] text-[var(--dash-text-muted)] uppercase tracking-wider">{subtitle}</p> : null}
        </div>
        {action}
      </div>
      {children}
    </div>
  );
}

function Stat({ label, value, sub, icon: Icon }: { label: string; value: string; sub: string; icon: any }) {
  return (
    <div className="bg-[var(--dash-graphite)] p-5 border-b-2 border-b-transparent">
      <div className="font-dash-mono text-[10px] text-[var(--dash-text-muted)] uppercase tracking-[0.15em] mb-3">
        {label}
      </div>
      <div className="font-dash-condensed font-extrabold text-4xl leading-none tracking-tight text-[var(--dash-text)]">
        {value}
      </div>
      <p className="mt-1 font-dash-mono text-[10px] text-[var(--dash-text-muted)]">{sub}</p>
    </div>
  );
}

function Stars({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={cn("h-4 w-4", i < rating ? "text-[var(--dash-amber)]" : "text-[var(--dash-text-muted)]")}
          fill={i < rating ? "currentColor" : "none"}
        />
      ))}
    </div>
  );
}

function Pill({ children }: { children: React.ReactNode }) {
  return (
    <span className="font-dash-mono text-[10px] px-2 py-0.5 border border-[var(--dash-border-bright)] text-[var(--dash-text-muted)] uppercase tracking-wider">{children}</span>
  );
}

function StatusPill({ status }: { status: "Pending" | "Sent" | "Failed" | "pending" | "sent" | "failed" | "completed" | string }) {
  const normalizedStatus = status.toLowerCase();
  const cls =
    normalizedStatus === "sent" || normalizedStatus === "completed"
      ? "text-[var(--dash-green)] border-[var(--dash-green)]/30"
      : normalizedStatus === "failed"
        ? "text-[var(--dash-red)] border-[var(--dash-red)]/30"
        : "text-[var(--dash-amber)] border-[var(--dash-amber)]/30";
  const displayStatus = normalizedStatus === "completed" ? "Sent" : status.charAt(0).toUpperCase() + status.slice(1);
  return <span className={cn("font-dash-mono text-[10px] px-2 py-0.5 border uppercase tracking-wider", cls)}>{displayStatus}</span>;
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
  sentThisMonth?: number;
  showUsageLimit?: boolean;
  monthlyLimit?: number;
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
  const showUsageLimit = stats.showUsageLimit === true;
  const sentThisMonth = stats.sentThisMonth ?? 0;
  const monthlyLimit = stats.monthlyLimit ?? 10;
  const showUpgradeBanner = showUsageLimit && (monthlyLimit === 10 ? sentThisMonth >= 8 : sentThisMonth >= 80);

  return (
    <>
      {/* Header */}
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between mb-6">
        <div>
          <h1 className="font-dash-condensed font-extrabold text-2xl uppercase tracking-wide text-[var(--dash-text)]">
            Reviews
          </h1>
          <p className="font-dash-mono text-[11px] text-[var(--dash-text-muted)] uppercase tracking-wider mt-0.5">
            Performance, automation, and recent feedback
          </p>
          {showUsageLimit && (
            <p className="font-dash-mono text-[11px] text-[var(--dash-text-dim)] mt-1">
              {sentThisMonth} / {monthlyLimit} review requests used this month
            </p>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {stats.platform && stats.platform.startsWith('http') && (
            <a
              href={stats.platform}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 border border-[var(--dash-border)] px-3 py-2 font-dash-mono text-[11px] uppercase tracking-wider text-[var(--dash-text-muted)] hover:bg-[var(--dash-surface)] hover:text-[var(--dash-text)] transition-colors"
            >
              View on {platformDisplay} <ExternalLink className="h-4 w-4" />
            </a>
          )}
          <Link href="/dashboard/settings">
            <button className="inline-flex items-center gap-2 border border-[var(--dash-amber)]/50 bg-[var(--dash-amber)]/10 px-3 py-2 font-dash-mono text-[11px] uppercase tracking-wider text-[var(--dash-amber)] hover:bg-[var(--dash-amber)]/20 transition-colors">
              <Settings2 className="h-4 w-4" /> Review Settings
            </button>
          </Link>
        </div>
      </div>

      {showUpgradeBanner && (
        <div className="mb-6 border border-[var(--dash-amber)]/50 bg-[var(--dash-amber)]/10 px-4 py-3 flex flex-wrap items-center justify-between gap-3">
          <p className="font-dash-mono text-[11px] text-[var(--dash-text)]">
            {monthlyLimit === 10
              ? "You're close to your monthly limit. Add the Reviews module for 100 review requests per month."
              : "You're close to your monthly limit (100 requests)."}
          </p>
          {monthlyLimit === 10 && (
            <Link
              href="/dashboard/settings/subscription"
              className="font-dash-mono text-[11px] uppercase tracking-wider text-[var(--dash-amber)] hover:underline"
            >
              Add Reviews module →
            </Link>
          )}
        </div>
      )}

      {/* Search */}
      <div className="mb-6 flex items-center gap-3 border border-[var(--dash-border)] bg-[var(--dash-graphite)] px-4 py-3">
        <Search className="h-4 w-4 text-[var(--dash-text-muted)]" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search reviews, customers, jobs..."
          className="w-full bg-transparent font-dash-mono text-[11px] text-[var(--dash-text)] placeholder:text-[var(--dash-text-muted)] outline-none uppercase tracking-wider"
        />
      </div>

      {/* KPI Row */}
      <div className="mb-6 grid grid-cols-2 sm:grid-cols-4 gap-px border border-[var(--dash-border)] bg-[var(--dash-border)]">
        <Stat label="Average Rating" value={stats.avgRating.toFixed(1)} sub="Last 90 days" icon={Star} />
        <Stat label="Total Reviews" value={String(stats.totalReviews)} sub="All-time" icon={Star} />
        <Stat label="Requests Sent" value={String(stats.requestsSent)} sub="Automation volume" icon={Send} />
        <Stat label="Pending" value={String(stats.pendingRequests)} sub="Needs attention" icon={Clock} />
      </div>

      {/* Automation + Pending */}
      <div className="mb-6 grid gap-4 lg:grid-cols-3">
        <Card
          title="Review Automation"
          subtitle="Turn completed jobs into 5-star reviews"
          action={
            <Link href="/dashboard/settings">
              <button className="border border-[var(--dash-border)] px-3 py-1.5 font-dash-mono text-[10px] uppercase tracking-wider text-[var(--dash-text-muted)] hover:bg-[var(--dash-surface)] hover:text-[var(--dash-text)] transition-colors">
                Adjust
              </button>
            </Link>
          }
        >
          <div className="space-y-3">
            <div className="border border-[var(--dash-border)] bg-[var(--dash-surface)] p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-dash-condensed font-bold text-[var(--dash-text)]">Active</p>
                  <p className="mt-0.5 font-dash-mono text-[11px] text-[var(--dash-text-muted)]">Sends {delayDisplay}</p>
                  <div className="mt-3 grid gap-2">
                    <div className="flex items-center justify-between border border-[var(--dash-border)] bg-[var(--dash-graphite)] px-4 py-3">
                      <p className="font-dash-mono text-[11px] text-[var(--dash-text-muted)]">Channels</p>
                      <span className="font-dash-condensed font-bold text-[var(--dash-text)]">{channelDisplay}</span>
                    </div>
                    <div className="flex items-center justify-between border border-[var(--dash-border)] bg-[var(--dash-graphite)] px-4 py-3">
                      <p className="font-dash-mono text-[11px] text-[var(--dash-text-muted)]">Platform</p>
                      <span className="font-dash-condensed font-bold text-[var(--dash-text)]">{platformDisplay}</span>
                    </div>
                  </div>
                </div>
                <div className="grid h-11 w-11 place-items-center border border-[var(--dash-green)]/30 bg-[var(--dash-green)]/10 text-[var(--dash-green)]">
                  <Star className="h-5 w-5" />
                </div>
              </div>
            </div>

            <div className="border border-[var(--dash-border)] bg-[var(--dash-surface)] p-4">
              <p className="font-dash-condensed font-bold text-[var(--dash-text)]">BRNNO Insight</p>
              <p className="mt-1 font-dash-mono text-[11px] text-[var(--dash-text-muted)]">
                Sending within 2–4 hours of completion typically improves response rate.
              </p>
              <Link href="/dashboard/settings">
                <button className="mt-3 w-full border border-[var(--dash-border)] bg-[var(--dash-graphite)] px-4 py-2 font-dash-mono text-[11px] text-[var(--dash-text-muted)] hover:bg-[var(--dash-surface)] hover:text-[var(--dash-text)] transition-colors">
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
                <button className="border border-[var(--dash-border)] px-3 py-1.5 font-dash-mono text-[10px] uppercase tracking-wider text-[var(--dash-text-muted)] hover:bg-[var(--dash-surface)] hover:text-[var(--dash-text)] transition-colors">
                  View all
                </button>
              </Link>
            }
          >
            <div className="space-y-0">
              {pending.map((r) => (
                <div
                  key={r.id}
                  className="flex flex-col gap-3 border-t border-[var(--dash-border)] p-4 first:border-t-0 hover:bg-[var(--dash-surface)] transition-colors md:flex-row md:items-center md:justify-between"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-dash-condensed font-bold text-[var(--dash-text)]">{r.customer_name}</p>
                      <StatusPill status={r.status as any} />
                      <Pill>{channelDisplay}</Pill>
                    </div>
                    <p className="mt-0.5 font-dash-mono text-[11px] text-[var(--dash-text-muted)]">{r.job?.title || "Job"}</p>

                    <div className="mt-3 grid gap-2 sm:grid-cols-2">
                      <div className="flex items-center gap-2 border border-[var(--dash-border)] bg-[var(--dash-graphite)] px-3 py-2 font-dash-mono text-[11px] text-[var(--dash-text-muted)]">
                        <Clock className="h-4 w-4 text-[var(--dash-text-muted)]" /> Scheduled: <span className="text-[var(--dash-text)]">{formatScheduledDate(r.send_at)}</span>
                      </div>
                      {r.customer_phone && (
                        <div className="flex items-center gap-2 border border-[var(--dash-border)] bg-[var(--dash-graphite)] px-3 py-2 font-dash-mono text-[11px] text-[var(--dash-text-muted)]">
                          <Phone className="h-4 w-4" /> {maskPhone(r.customer_phone)}
                        </div>
                      )}
                      {r.customer_email && (
                        <div className="flex items-center gap-2 border border-[var(--dash-border)] bg-[var(--dash-graphite)] px-3 py-2 font-dash-mono text-[11px] text-[var(--dash-text-muted)] sm:col-span-2">
                          <Mail className="h-4 w-4" /> {maskEmail(r.customer_email)}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => handleSendNow(r.id)}
                      className="border border-[var(--dash-amber)]/50 bg-[var(--dash-amber)]/10 px-4 py-2 font-dash-mono text-[11px] uppercase tracking-wider text-[var(--dash-amber)] hover:bg-[var(--dash-amber)]/20 transition-colors"
                    >
                      Send now
                    </button>
                    <button
                      onClick={() => handleDelete(r.id)}
                      className="border border-[var(--dash-border)] px-3 py-2 font-dash-mono text-[11px] text-[var(--dash-text-muted)] hover:bg-[var(--dash-surface)] hover:text-[var(--dash-text)] transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}

              {pending.length === 0 ? (
                <div className="border-t border-[var(--dash-border)] p-6 text-center">
                  <p className="font-dash-condensed font-bold text-[var(--dash-text)]">No pending requests</p>
                  <p className="mt-0.5 font-dash-mono text-[11px] text-[var(--dash-text-muted)]">Automation is running smoothly.</p>
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
              <button className="border border-[var(--dash-border)] px-3 py-1.5 font-dash-mono text-[10px] uppercase tracking-wider text-[var(--dash-text-muted)] hover:bg-[var(--dash-surface)] hover:text-[var(--dash-text)] transition-colors">
                Export
              </button>
            }
          >
            <div className="grid gap-px border border-[var(--dash-border)] bg-[var(--dash-border)] lg:grid-cols-2">
              {recent.map((r) => (
                <div key={r.id} className="border border-[var(--dash-border)] bg-[var(--dash-graphite)] p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-dash-condensed font-bold text-[var(--dash-text)]">{r.name}</p>
                      <p className="mt-0.5 font-dash-mono text-[11px] text-[var(--dash-text-muted)]">{r.service}</p>
                    </div>
                    <div className="text-right">
                      <Stars rating={r.rating} />
                      <p className="mt-1 font-dash-mono text-[10px] text-[var(--dash-text-muted)]">{r.date} · {r.source}</p>
                    </div>
                  </div>
                  <p className="mt-4 font-dash-mono text-[11px] text-[var(--dash-text-dim)] leading-relaxed">{r.text}</p>
                </div>
              ))}

              {recent.length === 0 ? (
                <div className="border border-[var(--dash-border)] bg-[var(--dash-graphite)] p-6 text-center lg:col-span-2">
                  <p className="font-dash-condensed font-bold text-[var(--dash-text)]">No reviews found</p>
                  <p className="mt-0.5 font-dash-mono text-[11px] text-[var(--dash-text-muted)]">Try adjusting your search.</p>
                </div>
              ) : null}
            </div>
          </Card>
        </div>
      )}

      <footer className="mt-10 pb-6 text-center font-dash-mono text-[10px] text-[var(--dash-text-muted)]">Reviews</footer>
    </>
  );
}
