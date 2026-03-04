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
      <div className="border border-[var(--dash-border)] bg-[var(--dash-graphite)] p-4">
        <h3 className="font-dash-condensed font-bold text-sm uppercase tracking-wider text-[var(--dash-text)]">Weather</h3>
        <p className="mt-0.5 font-dash-mono text-[10px] text-[var(--dash-text-muted)]">At your business location</p>
        <p className="mt-3 font-dash-mono text-[11px] text-[var(--dash-text-dim)]">
          Set business location in Settings to see weather.
        </p>
        <Link
          href="/dashboard/settings"
          className="mt-3 inline-block font-dash-condensed font-bold text-[12px] uppercase tracking-wider text-[var(--dash-amber)] hover:text-[var(--dash-amber-dim)] transition-colors"
        >
          Settings
        </Link>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="border border-[var(--dash-border)] bg-[var(--dash-graphite)] p-4">
        <h3 className="font-dash-condensed font-bold text-sm uppercase tracking-wider text-[var(--dash-text)]">Weather</h3>
        <p className="mt-0.5 font-dash-mono text-[10px] text-[var(--dash-text-muted)]">At your business location</p>
        <p className="mt-4 font-dash-mono text-[11px] text-[var(--dash-text-muted)]">Loading…</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="border border-[var(--dash-border)] bg-[var(--dash-graphite)] p-4">
        <h3 className="font-dash-condensed font-bold text-sm uppercase tracking-wider text-[var(--dash-text)]">Weather</h3>
        <p className="mt-0.5 font-dash-mono text-[10px] text-[var(--dash-text-muted)]">At your business location</p>
        <p className="mt-3 font-dash-mono text-[11px] text-[var(--dash-text-dim)]">{error}</p>
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
    <div className="border border-[var(--dash-border)] bg-[var(--dash-graphite)] p-4">
      <h3 className="font-dash-condensed font-bold text-sm uppercase tracking-wider text-[var(--dash-text)]">Weather</h3>
      <p className="mt-0.5 font-dash-mono text-[10px] text-[var(--dash-text-muted)]">At your business location</p>
      <div className="mt-3 space-y-2">
        {displayDays.length === 0 ? (
          <p className="font-dash-mono text-[11px] text-[var(--dash-text-muted)]">No forecast data</p>
        ) : (
          displayDays.map((key) => {
            const f = forecasts[key]
            if (!f) return null
            const icon = weatherIcon(f.condition, f.icon)
            return (
              <div
                key={key}
                className="flex items-center justify-between gap-3 border border-[var(--dash-border)] bg-[var(--dash-surface)] px-3 py-2"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-xl">{icon}</span>
                  <div>
                    <p className="font-dash-condensed font-semibold text-sm text-[var(--dash-text)]">
                      {formatDayLabel(key)}
                    </p>
                    <p className="font-dash-mono text-[10px] text-[var(--dash-text-muted)] capitalize">
                      {f.description}
                      {f.rain_probability >= 30 && (
                        <span className="ml-1">({Math.round(f.rain_probability)}% rain)</span>
                      )}
                    </p>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="font-dash-condensed font-bold text-sm text-[var(--dash-text)]">
                    {Math.round(f.temp_high)}° / {Math.round(f.temp_low)}°
                  </p>
                  <p className="font-dash-mono text-[9px] text-[var(--dash-text-muted)]">H / L</p>
                </div>
              </div>
            )
          })
        )}
      </div>
      <Link
        href="/dashboard/schedule"
        className="mt-3 inline-block font-dash-condensed font-bold text-[11px] uppercase tracking-wider text-[var(--dash-amber)] hover:text-[var(--dash-amber-dim)] transition-colors"
      >
        Calendar
      </Link>
    </div>
  )
}
