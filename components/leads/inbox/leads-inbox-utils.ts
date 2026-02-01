/**
 * Shared helpers and constants for the leads inbox UI.
 * Display status (6 tabs) is derived from DB status + score; mapping to DB when updating.
 */

export type DisplayStatus = 'new' | 'followup' | 'warm' | 'hot' | 'booked' | 'cold'

export type DbStatus = 'new' | 'in_progress' | 'quoted' | 'nurturing' | 'booked' | 'lost'

interface LeadForDisplayStatus {
  status: string
  score: 'hot' | 'warm' | 'cold'
  job_id: string | null
  last_contacted_at: string | null
}

export function formatMoney(n: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n)
}

export function timeAgo(iso: string): string {
  const then = new Date(iso).getTime()
  const now = Date.now()
  const diff = Math.max(0, now - then)
  const minutes = Math.floor(diff / 60000)
  if (minutes < 1) return 'Just now'
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

export function getDisplayStatus(lead: LeadForDisplayStatus): DisplayStatus {
  const booked = lead.status === 'booked' || !!lead.job_id
  if (booked) return 'booked'
  if (lead.status === 'lost') return 'cold'
  if (lead.status === 'new') return 'new'
  if (lead.status === 'in_progress' && lead.last_contacted_at) return 'followup'
  if (lead.score === 'hot') return 'hot'
  if (lead.score === 'warm') return 'warm'
  if (lead.score === 'cold') return 'cold'
  if (lead.status === 'in_progress') return 'followup'
  if (lead.status === 'quoted') return 'hot'
  if (lead.status === 'nurturing') return 'warm'
  return 'new'
}

export function displayStatusToDbStatus(display: DisplayStatus): DbStatus {
  const map: Record<DisplayStatus, DbStatus> = {
    new: 'new',
    followup: 'in_progress',
    warm: 'nurturing',
    hot: 'quoted',
    booked: 'booked',
    cold: 'lost',
  }
  return map[display]
}

export function nextActionHint(lead: LeadForDisplayStatus): string | null {
  const status = getDisplayStatus(lead)
  if (status === 'booked') return null
  if (status === 'new') return 'Call within 30 minutes to maximize booking chance.'
  if (status === 'hot') return 'Call now—high intent. Offer 2 booking options.'
  if (status === 'warm') return 'Text availability + ask for vehicle/location to quote accurately.'
  if (status === 'followup') return 'Send a short follow-up and offer a specific time slot.'
  if (status === 'cold') return 'Final ping: ask if they want to close out or reschedule later.'
  return 'Follow up promptly.'
}

export function serviceEstTimeFallback(serviceName: string | null): string {
  if (!serviceName) return '2–3 hrs'
  const s = serviceName.toLowerCase()
  if (s.includes('ceramic')) return '4–8 hrs'
  if (s.includes('interior')) return '2–4 hrs'
  if (s.includes('exterior')) return '1–2 hrs'
  if (s.includes('cloud')) return '2–3 hrs'
  return '2–3 hrs'
}

export const STATUS_LABEL: Record<DisplayStatus, string> = {
  new: 'New',
  followup: 'Follow-Up',
  warm: 'Warm',
  hot: 'Hot',
  booked: 'Booked',
  cold: 'Cold',
}

export const STATUS_DOT_CLASS: Record<DisplayStatus, string> = {
  new: 'bg-violet-500',
  followup: 'bg-blue-500',
  warm: 'bg-amber-500',
  hot: 'bg-rose-500',
  booked: 'bg-emerald-500',
  cold: 'bg-zinc-400',
}

export const STATUS_PILL_CLASS: Record<DisplayStatus, string> = {
  new: 'bg-violet-50 text-violet-700 ring-violet-200 dark:bg-violet-900/30 dark:text-violet-300 dark:ring-violet-700',
  followup: 'bg-blue-50 text-blue-700 ring-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:ring-blue-700',
  warm: 'bg-amber-50 text-amber-800 ring-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:ring-amber-700',
  hot: 'bg-rose-50 text-rose-700 ring-rose-200 dark:bg-rose-900/30 dark:text-rose-300 dark:ring-rose-700',
  booked: 'bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:ring-emerald-700',
  cold: 'bg-zinc-50 text-zinc-700 ring-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:ring-zinc-600',
}

export const QUICK_TEXTS = {
  intro: (name: string) =>
    `Hey ${name}! This is BRNNO Cloud Detailing 👋 I just saw your request. What vehicle are we detailing and where are you located?`,
  availability: (_name: string) =>
    `I can fit you in tomorrow or Friday — which works better?`,
  bookNow: (_name: string) =>
    `Want me to lock in a spot? If you share your address + vehicle, I'll confirm the exact price and time window.`,
}
