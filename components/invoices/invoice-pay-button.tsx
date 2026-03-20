'use client'

import { useState } from 'react'

export function InvoicePayButton({ token }: { token: string }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handlePay() {
    setError(null)
    setLoading(true)
    try {
      const res = await fetch(`/api/invoice/${encodeURIComponent(token)}/pay`, {
        method: 'POST',
      })
      const data = (await res.json()) as { checkoutUrl?: string; error?: string }
      if (!res.ok) {
        setError(data.error || 'Could not start payment')
        return
      }
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl
        return
      }
      setError('Invalid response from server')
    } catch {
      setError('Network error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mt-8 print:hidden">
      {error ? (
        <p className="mb-3 text-center text-sm text-red-600" role="alert">
          {error}
        </p>
      ) : null}
      <button
        type="button"
        onClick={handlePay}
        disabled={loading}
        className="flex w-full cursor-pointer items-center justify-center rounded-xl bg-zinc-900 px-4 py-3.5 text-center text-sm font-semibold text-white shadow-sm transition-opacity hover:opacity-95 disabled:cursor-wait disabled:opacity-70"
      >
        {loading ? 'Redirecting…' : 'Pay now'}
      </button>
      <p className="mt-2 text-center text-xs text-zinc-500">
        Secure payment via Stripe. You’ll return here after paying.
      </p>
    </div>
  )
}
