'use client'

import { ArrowUpRight, ArrowDownRight, DollarSign, Users, AlertTriangle, Clock, MessageSquare, type LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import Link from 'next/link'

const iconMap: Record<string, LucideIcon> = {
  DollarSign,
  Users,
  AlertTriangle,
  Clock,
  MessageSquare,
}

interface KpiCardProps {
  title: string
  value: string
  sub?: string
  trend?: string
  trendDir?: 'up' | 'down'
  icon: string // Icon name as string
  tone: 'violet' | 'amber' | 'cyan' | 'emerald' | 'red' | 'orange'
  onClick?: () => void
  href?: string
  className?: string
}

export function KpiCard({
  title,
  value,
  sub,
  trend,
  trendDir,
  icon: iconName,
  tone,
  onClick,
  href,
  className,
}: KpiCardProps) {
  const Icon = iconMap[iconName] || DollarSign // Default to DollarSign if icon not found
  const toneMap: Record<string, string> = {
    violet: 'from-violet-500/18 dark:from-violet-500/18 to-violet-500/5 dark:to-violet-500/5 ring-violet-500/20 dark:ring-violet-500/20 border-violet-500/20 dark:border-violet-500/30',
    amber: 'from-amber-500/18 dark:from-amber-500/18 to-amber-500/5 dark:to-amber-500/5 ring-amber-500/20 dark:ring-amber-500/20 border-amber-500/20 dark:border-amber-500/30',
    cyan: 'from-cyan-500/18 dark:from-cyan-500/18 to-cyan-500/5 dark:to-cyan-500/5 ring-cyan-500/20 dark:ring-cyan-500/20 border-cyan-500/20 dark:border-cyan-500/30',
    emerald: 'from-emerald-500/18 dark:from-emerald-500/18 to-emerald-500/5 dark:to-emerald-500/5 ring-emerald-500/20 dark:ring-emerald-500/20 border-emerald-500/20 dark:border-emerald-500/30',
    red: 'from-red-500/18 dark:from-red-500/18 to-red-500/5 dark:to-red-500/5 ring-red-500/20 dark:ring-red-500/20 border-red-500/20 dark:border-red-500/30',
    orange: 'from-orange-500/18 dark:from-orange-500/18 to-orange-500/5 dark:to-orange-500/5 ring-orange-500/20 dark:ring-orange-500/20 border-orange-500/20 dark:border-orange-500/30',
  }

  const content = (
    <div
      className={cn(
        'relative overflow-hidden rounded-3xl border bg-gradient-to-br p-5 backdrop-blur-sm shadow-lg dark:shadow-[0_10px_30px_rgba(0,0,0,0.35)] ring-1 transition hover:-translate-y-0.5 hover:bg-zinc-50 dark:hover:bg-white/6 cursor-pointer',
        toneMap[tone],
        className
      )}
      onClick={onClick}
    >
      <div className="absolute -right-10 -top-12 h-40 w-40 rounded-full bg-zinc-100/50 dark:bg-white/5 blur-2xl" />

      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <p className="text-sm font-medium text-zinc-700 dark:text-white/65">{title}</p>
          <p className="mt-3 text-3xl font-semibold text-zinc-900 dark:text-white tracking-tight">
            {value}
          </p>
          {sub && (
            <p className="mt-1 text-xs text-zinc-600 dark:text-white/45">{sub}</p>
          )}
        </div>

        <div className="flex flex-col items-end gap-2">
          <div className="grid h-11 w-11 place-items-center rounded-2xl border border-zinc-200/50 dark:border-white/10 bg-zinc-50/50 dark:bg-white/5">
            <Icon className="h-5 w-5 text-zinc-700 dark:text-white/75" />
          </div>

          {trend && (
            <div
              className={cn(
                'inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs',
                trendDir === 'down'
                  ? 'bg-rose-500/15 dark:bg-rose-500/15 text-rose-700 dark:text-rose-300'
                  : 'bg-emerald-500/15 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
              )}
            >
              {trendDir === 'down' ? (
                <ArrowDownRight className="h-3.5 w-3.5" />
              ) : (
                <ArrowUpRight className="h-3.5 w-3.5" />
              )}
              {trend}
            </div>
          )}
        </div>
      </div>
    </div>
  )

  if (href) {
    return <Link href={href}>{content}</Link>
  }

  return content
}
