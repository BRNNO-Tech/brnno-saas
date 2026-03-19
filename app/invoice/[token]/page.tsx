import { notFound } from 'next/navigation'
import Image from 'next/image'
import type { Metadata } from 'next'
import type { PostgrestError } from '@supabase/supabase-js'
import { createClient as createServiceClient } from '@/lib/supabase/service-client'

export const dynamic = 'force-dynamic'

type PageProps = { params: Promise<{ token: string }> }

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { token } = await params
  return {
    title: 'Invoice',
    robots: { index: false, follow: false },
    description: `Invoice ${token.slice(0, 8)}…`,
  }
}

type InvoiceRow = {
  id: string
  business_id: string
  client_id: string
  job_id: string | null
  status: string
  total: number
  paid_amount: number | null
  discount_amount: number | null
  discount_code: string | null
  share_token: string | null
  share_token_expires_at: string | null
  created_at: string
  client: { name: string } | null
  invoice_items: Array<{
    id: string
    name: string
    description: string | null
    price: number
    quantity: number
  }> | null
  business: { name: string | null; logo_url: string | null } | null
}

async function loadInvoice(token: string): Promise<{
  data: InvoiceRow | null
  error: PostgrestError | null
}> {
  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from('invoices')
    .select(
      `
      id,
      business_id,
      client_id,
      job_id,
      status,
      total,
      paid_amount,
      discount_amount,
      discount_code,
      share_token,
      share_token_expires_at,
      created_at,
      client:clients(name),
      invoice_items(id, name, description, price, quantity),
      business:businesses(name, logo_url)
    `
    )
    .eq('share_token', token)
    .maybeSingle()

  if (error) {
    console.error('Public invoice load error:', error)
    return { data: null, error }
  }
  return { data: data as InvoiceRow | null, error: null }
}

function formatMoney(n: number) {
  return n.toLocaleString('en-US', { style: 'currency', currency: 'USD' })
}

export default async function PublicInvoicePage({ params }: PageProps) {
  const { token } = await params
  if (!token?.trim()) notFound()

  const { data: invoice, error } = await loadInvoice(token.trim())
  if (!invoice) {
    console.log('[invoice-page] Token:', token)
    console.log('[invoice-page] Query result:', { data: invoice, error })
    notFound()
  }

  const expiresAt = invoice.share_token_expires_at
    ? new Date(invoice.share_token_expires_at)
    : null
  if (expiresAt && expiresAt.getTime() < Date.now()) {
    return (
      <div className="min-h-svh bg-zinc-100 text-zinc-900 flex items-center justify-center p-6">
        <div className="max-w-md w-full rounded-xl border border-zinc-200 bg-white p-8 shadow-sm text-center">
          <h1 className="text-lg font-semibold tracking-tight">Link expired</h1>
          <p className="mt-2 text-sm text-zinc-600">
            This invoice link is no longer valid. Ask the business for a new link.
          </p>
        </div>
      </div>
    )
  }

  const business = invoice.business
  const items = invoice.invoice_items ?? []
  const subtotal = items.reduce((sum, row) => sum + row.price * row.quantity, 0)
  const discount = invoice.discount_amount ?? 0
  const total = invoice.total
  const paid = invoice.paid_amount ?? 0
  const amountDue = Math.max(0, total - paid)
  const isPaid = invoice.status === 'paid' || amountDue <= 0
  const label = `Invoice #${invoice.id.slice(0, 8)}`

  return (
    <div className="min-h-svh bg-zinc-100 text-zinc-900 py-8 px-4 sm:py-12 sm:px-6">
      <article className="mx-auto max-w-2xl rounded-2xl border border-zinc-200 bg-white shadow-sm overflow-hidden">
        <header className="border-b border-zinc-100 px-5 py-6 sm:px-8 sm:py-8">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-start gap-4 min-w-0">
              {business?.logo_url ? (
                <div className="relative h-14 w-14 sm:h-16 sm:w-16 shrink-0 overflow-hidden rounded-lg border border-zinc-100 bg-zinc-50">
                  <Image
                    src={business.logo_url}
                    alt=""
                    fill
                    className="object-cover"
                    sizes="64px"
                  />
                </div>
              ) : (
                <div className="flex h-14 w-14 sm:h-16 sm:w-16 shrink-0 items-center justify-center rounded-lg bg-zinc-900 text-white text-lg font-semibold">
                  {(business?.name || 'B').slice(0, 1).toUpperCase()}
                </div>
              )}
              <div className="min-w-0">
                <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">
                  Invoice
                </p>
                <h1 className="mt-1 text-xl sm:text-2xl font-semibold tracking-tight truncate">
                  {business?.name || 'Business'}
                </h1>
                <p className="mt-1 text-sm text-zinc-600">{label}</p>
                <p className="mt-0.5 text-xs text-zinc-500">
                  {new Date(invoice.created_at).toLocaleDateString('en-US', {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </p>
              </div>
            </div>
            <div className="flex flex-col items-stretch sm:items-end gap-2">
              {isPaid ? (
                <span className="inline-flex items-center justify-center rounded-full bg-emerald-50 px-3 py-1 text-sm font-medium text-emerald-800 ring-1 ring-emerald-200/60">
                  Paid ✓
                </span>
              ) : (
                <span className="inline-flex items-center justify-center rounded-full bg-amber-50 px-3 py-1 text-sm font-medium text-amber-900 ring-1 ring-amber-200/60">
                  Payment due
                </span>
              )}
            </div>
          </div>
          <div className="mt-6 rounded-lg bg-zinc-50 px-4 py-3 border border-zinc-100">
            <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">Bill to</p>
            <p className="mt-1 text-base font-medium text-zinc-900">
              {invoice.client?.name || 'Client'}
            </p>
          </div>
        </header>

        <div className="px-5 py-6 sm:px-8 sm:py-8">
          <div className="overflow-x-auto -mx-5 sm:mx-0 sm:rounded-lg sm:border sm:border-zinc-200">
            <table className="w-full min-w-[320px] text-sm">
              <thead>
                <tr className="border-b border-zinc-200 bg-zinc-50/80 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">
                  <th className="px-4 py-3 sm:px-5">Item</th>
                  <th className="px-2 py-3 text-center w-16">Qty</th>
                  <th className="px-2 py-3 text-right w-24">Price</th>
                  <th className="px-4 py-3 text-right w-28 sm:pr-5">Amount</th>
                </tr>
              </thead>
              <tbody>
                {items.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-zinc-500">
                      No line items
                    </td>
                  </tr>
                ) : (
                  items.map((row, i) => (
                    <tr key={row.id || i} className="border-b border-zinc-100 last:border-0">
                      <td className="px-4 py-3 sm:px-5 align-top">
                        <div className="font-medium text-zinc-900">{row.name}</div>
                        {row.description ? (
                          <div className="mt-0.5 text-xs text-zinc-500">{row.description}</div>
                        ) : null}
                      </td>
                      <td className="px-2 py-3 text-center text-zinc-700 align-top">{row.quantity}</td>
                      <td className="px-2 py-3 text-right text-zinc-700 tabular-nums align-top">
                        {formatMoney(row.price)}
                      </td>
                      <td className="px-4 py-3 text-right font-medium text-zinc-900 tabular-nums sm:pr-5 align-top">
                        {formatMoney(row.price * row.quantity)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="mt-6 space-y-2 border-t border-zinc-100 pt-6">
            <div className="flex justify-between text-sm text-zinc-600">
              <span>Subtotal</span>
              <span className="tabular-nums">{formatMoney(subtotal)}</span>
            </div>
            {discount > 0 ? (
              <div className="flex justify-between text-sm text-emerald-700">
                <span>
                  Discount
                  {invoice.discount_code ? ` (${invoice.discount_code})` : ''}
                </span>
                <span className="tabular-nums">−{formatMoney(discount)}</span>
              </div>
            ) : null}
            <div className="flex justify-between text-base font-semibold text-zinc-900 pt-1">
              <span>Total</span>
              <span className="tabular-nums">{formatMoney(total)}</span>
            </div>
            {!isPaid && (
              <div className="flex justify-between text-base font-semibold text-zinc-900 border-t border-zinc-100 pt-3">
                <span>Amount due</span>
                <span className="tabular-nums text-amber-700">{formatMoney(amountDue)}</span>
              </div>
            )}
          </div>

          {!isPaid && amountDue > 0 && (
            <div className="mt-8">
              <span
                className="flex w-full cursor-default items-center justify-center rounded-xl bg-zinc-900 px-4 py-3.5 text-center text-sm font-semibold text-white shadow-sm opacity-90"
                aria-disabled="true"
                title="Payment link placeholder — connect Stripe Checkout when ready"
              >
                Pay now
              </span>
              <p className="mt-2 text-center text-xs text-zinc-500">
                Online card payment can be connected to Stripe later — contact the business to pay today.
              </p>
            </div>
          )}
        </div>
      </article>
    </div>
  )
}
