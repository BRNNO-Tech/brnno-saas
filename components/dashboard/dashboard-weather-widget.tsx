'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

type ForecastDay = {
  date: string
  temp_high: number
  temp_low: number
  condition: string
  icon: string
  rain_probability: number
  description: string
}

function getDateKey(d: Date): string {
  return d.toISOString().split('T')[0]
}

function weatherIcon(condition: string, iconCode: string): string {
  if (iconCode?.startsWith('11')) return '⛈️'
  if (iconCode?.startsWith('10') || condition === 'Rain') return '🌧️'
  if (iconCode?.startsWith('09') || condition === 'Drizzle') return '🌦️'
  if (iconCode?.startsWith('13') || condition === 'Snow') return '❄️'
  if (iconCode?.startsWith('50') || condition === 'Mist' || condition === 'Fog') return '🌫️'
  if (iconCode?.startsWith('01')) return '☀️'
  if (iconCode?.startsWith('02')) return '⛅'
  if (iconCode?.startsWith('03') || iconCode?.startsWith('04')) return '☁️'
  return '🌤️'
}

function formatDayLabel(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00')
  const today = new Date()
  const isToday =
    d.getDate() === today.getDate() &&
    d.getMonth() === today.getMonth() &&
    d.getFullYear() === today.getFullYear()
  if (isToday) return 'Today'
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)
  if (
    d.getDate() === tomorrow.getDate() &&
    d.getMonth() === tomorrow.getMonth() &&
    d.getFullYear() === tomorrow.getFullYear()
  )
    return 'Tomorrow'
  return d.toLocaleDateString('en-US', { weekday: 'short' })
}

export function DashboardWeatherWidget({ businessAddress }: { businessAddress: string | null }) {
  const [forecasts, setForecasts] = useState<Record<string, ForecastDay>>({})
  const [loading, setLoading] = useState(!!businessAddress?.trim())
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!businessAddress || businessAddress.trim().length < 3) {
      setLoading(false)
      return
    }

    let cancelled = false

    async function load() {
      setLoading(true)
      setError(null)
      try {
        const { geocodeAddress } = await import('@/lib/utils/geocode')
        const coords = await geocodeAddress(businessAddress!)
        if (cancelled || !coords) {
          if (!cancelled) setError('Location not found')
          return
        }
        const res = await fetch(`/api/weather?lat=${coords.lat}&lon=${coords.lon}`)
        if (!res.ok) throw new Error('Weather unavailable')
        const data = await res.json()
        if (cancelled) return
        setForecasts(data.forecasts || {})
      } catch (e) {
        if (!cancelled) {
          setError('Unable to load weather')
          console.error(e)
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [businessAddress])

  if (!businessAddress || businessAddress.trim().length < 3) {
    return (
      <div className="rounded-3xl border border-zinc-200/50 dark:border-white/10 bg-white/80 dark:bg-white/5 backdrop-blur-sm p-5 shadow-lg dark:shadow-[0_12px_40px_rgba(0,0,0,0.35)]">
        <h3 className="text-sm font-semibold text-zinc-900 dark:text-white">Weather</h3>
        <p className="mt-1 text-xs text-zinc-600 dark:text-white/45">At your business location</p>
        <p className="mt-3 text-sm text-zinc-600 dark:text-white/55">
          Set business location in Settings to see weather.
        </p>
        <Link
          href="/dashboard/settings"
          className="mt-3 inline-block text-sm font-medium text-violet-600 dark:text-violet-400 hover:underline"
        >
          Settings
        </Link>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="rounded-3xl border border-zinc-200/50 dark:border-white/10 bg-white/80 dark:bg-white/5 backdrop-blur-sm p-5 shadow-lg dark:shadow-[0_12px_40px_rgba(0,0,0,0.35)]">
        <h3 className="text-sm font-semibold text-zinc-900 dark:text-white">Weather</h3>
        <p className="mt-1 text-xs text-zinc-600 dark:text-white/45">At your business location</p>
        <p className="mt-4 text-sm text-zinc-500 dark:text-white/45">Loading…</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-3xl border border-zinc-200/50 dark:border-white/10 bg-white/80 dark:bg-white/5 backdrop-blur-sm p-5 shadow-lg dark:shadow-[0_12px_40px_rgba(0,0,0,0.35)]">
        <h3 className="text-sm font-semibold text-zinc-900 dark:text-white">Weather</h3>
        <p className="mt-1 text-xs text-zinc-600 dark:text-white/45">At your business location</p>
        <p className="mt-3 text-sm text-zinc-600 dark:text-white/55">{error}</p>
      </div>
    )
  }

  const todayKey = getDateKey(new Date())
  const days: string[] = [todayKey]
  for (let i = 1; i <= 2; i++) {
    const d = new Date()
    d.setDate(d.getDate() + i)
    days.push(getDateKey(d))
  }
  const displayDays = days.filter((k) => forecasts[k])

  return (
    <div className="rounded-3xl border border-zinc-200/50 dark:border-white/10 bg-white/80 dark:bg-white/5 backdrop-blur-sm p-5 shadow-lg dark:shadow-[0_12px_40px_rgba(0,0,0,0.35)]">
      <h3 className="text-sm font-semibold text-zinc-900 dark:text-white">Weather</h3>
      <p className="mt-1 text-xs text-zinc-600 dark:text-white/45">At your business location</p>
      <div className="mt-3 space-y-3">
        {displayDays.length === 0 ? (
          <p className="text-sm text-zinc-500 dark:text-white/45">No forecast data</p>
        ) : (
          displayDays.map((key) => {
            const f = forecasts[key]
            if (!f) return null
            const icon = weatherIcon(f.condition, f.icon)
            return (
              <div
                key={key}
                className="flex items-center justify-between gap-3 rounded-2xl border border-zinc-200/50 dark:border-white/10 bg-zinc-50/50 dark:bg-black/20 px-3 py-2"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-xl">{icon}</span>
                  <div>
                    <p className="text-sm font-medium text-zinc-900 dark:text-white">
                      {formatDayLabel(key)}
                    </p>
                    <p className="text-xs text-zinc-600 dark:text-white/50 capitalize">
                      {f.description}
                      {f.rain_probability >= 30 && (
                        <span className="ml-1">({Math.round(f.rain_probability)}% rain)</span>
                      )}
                    </p>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-semibold text-zinc-900 dark:text-white">
                    {Math.round(f.temp_high)}° / {Math.round(f.temp_low)}°
                  </p>
                  <p className="text-xs text-zinc-500 dark:text-white/45">H / L</p>
                </div>
              </div>
            )
          })
        )}
      </div>
      <Link
        href="/dashboard/schedule"
        className="mt-3 inline-block text-xs font-medium text-violet-600 dark:text-violet-400 hover:underline"
      >
        Calendar
      </Link>
    </div>
  )
}
