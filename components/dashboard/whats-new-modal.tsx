'use client'

import { useCallback, useEffect, useState } from 'react'
import {
  CURRENT_UPDATE_VERSION,
  currentRelease,
  getEntryDotColor,
} from '@/lib/updates/whats-new'

const STORAGE_KEY = 'brnno_last_seen_update'
const SHOW_DELAY_MS = 500
const TRANSITION_MS = 300

export default function WhatsNewModal() {
  const [active, setActive] = useState(false)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    try {
      if (localStorage.getItem(STORAGE_KEY) === CURRENT_UPDATE_VERSION) return
    } catch {
      return
    }

    setActive(true)
    const timer = window.setTimeout(() => {
      requestAnimationFrame(() => setVisible(true))
    }, SHOW_DELAY_MS)

    return () => window.clearTimeout(timer)
  }, [])

  const dismiss = useCallback(() => {
    setVisible(false)
    window.setTimeout(() => {
      try {
        localStorage.setItem(STORAGE_KEY, CURRENT_UPDATE_VERSION)
      } catch {
        /* ignore quota / private mode */
      }
      setActive(false)
    }, TRANSITION_MS)
  }, [])

  useEffect(() => {
    if (!active || !visible) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') dismiss()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [active, visible, dismiss])

  useEffect(() => {
    if (!active) return
    const prev = document.body.style.overflow
    if (visible) document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [active, visible])

  if (!active) return null

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="whats-new-title"
    >
      <div
        className="absolute inset-0 transition-opacity duration-300 ease-out"
        style={{
          backgroundColor: 'rgba(0,0,0,0.6)',
          opacity: visible ? 1 : 0,
        }}
        aria-hidden
      />

      <div
        className="relative w-full max-w-[480px] transition-all duration-300 ease-out"
        style={{
          opacity: visible ? 1 : 0,
          transform: visible ? 'translateY(0)' : 'translateY(20px)',
        }}
      >
        <div
          className="rounded-2xl p-8"
          style={{
            backgroundColor: '#1E1E1C',
            border: '1px solid #2C2C2A',
          }}
        >
          <p
            className="font-dash-condensed font-bold uppercase text-[#EF9F27]"
            style={{ fontSize: 12, letterSpacing: '2px' }}
          >
            What&apos;s New
          </p>
          <h2
            id="whats-new-title"
            className="mt-2 font-dash-condensed font-bold text-white"
            style={{ fontSize: 24 }}
          >
            {currentRelease.title}
          </h2>
          <p
            className="mt-1 font-dash-mono text-[#888780]"
            style={{ fontSize: 12 }}
          >
            {currentRelease.date}
          </p>

          <ul className="mt-6 flex flex-col gap-3 max-h-[min(50vh,360px)] overflow-y-auto pr-1">
            {currentRelease.entries.map((entry) => (
              <li key={entry.title} className="flex gap-3">
                <span
                  className="mt-1.5 h-2 w-2 shrink-0 rounded-full"
                  style={{ backgroundColor: getEntryDotColor(entry.type) }}
                  aria-hidden
                />
                <div className="min-w-0">
                  <p className="font-dash-condensed font-semibold text-white" style={{ fontSize: 14 }}>
                    {entry.title}
                  </p>
                  <p className="mt-0.5 text-[#B4B2A9]" style={{ fontSize: 13 }}>
                    {entry.description}
                  </p>
                </div>
              </li>
            ))}
          </ul>

          <button
            type="button"
            onClick={dismiss}
            className="mt-8 w-full rounded-lg py-3 font-dash-condensed font-semibold uppercase transition-opacity hover:opacity-90"
            style={{
              backgroundColor: '#EF9F27',
              color: '#141413',
              fontSize: 15,
              letterSpacing: '1px',
            }}
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  )
}
