import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2026-01-28.clover',
    })
  : null

const supabase =
  process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY
    ? createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
        auth: { autoRefreshToken: false, persistSession: false },
      })
    : null

function getAppBaseUrl() {
  const raw = process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL
  if (raw?.trim()) return raw.replace(/\/$/, '')
  const vercel = process.env.VERCEL_URL
  if (vercel?.trim()) return `https://${vercel.replace(/\/$/, '')}`
  return 'http://localhost:3000'
}

/** Platform fee: 2.9% + $0.30 (amount in cents). */
function platformFeeCents(chargeAmountCents: number) {
  return Math.round(chargeAmountCents * 0.029 + 30)
}

export async function POST(
  _request: NextRequest,
  context: { params: Promise<{ token: string }> }
) {
  try {
    if (!stripe) {
      return NextResponse.json({ error: 'Stripe is not configured' }, { status: 500 })
    }
    if (!supabase) {
      return NextResponse.json({ error: 'Database is not configured' }, { status: 500 })
    }

    const { token } = await context.params
    const trimmed = token?.trim()
    if (!trimmed) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 400 })
    }

    const { data: invoice, error: invError } = await supabase
      .from('invoices')
      .select(
        `
        id,
        business_id,
        status,
        total,
        paid_amount,
        share_token,
        share_token_expires_at,
        invoice_items(id, name, description, price, quantity),
        business:businesses(stripe_account_id, stripe_onboarding_completed)
      `
      )
      .eq('share_token', trimmed)
      .maybeSingle()

    if (invError) {
      console.error('[invoice/pay]', invError)
      return NextResponse.json({ error: 'Failed to load invoice' }, { status: 500 })
    }
    if (!invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
    }

    const expiresAt = invoice.share_token_expires_at
      ? new Date(invoice.share_token_expires_at).getTime()
      : null
    if (expiresAt !== null && expiresAt <= Date.now()) {
      return NextResponse.json({ error: 'This invoice link has expired' }, { status: 400 })
    }

    const total = Number(invoice.total)
    const paid = Number(invoice.paid_amount ?? 0)
    const amountDue = Math.max(0, total - paid)

    if (invoice.status === 'paid' || amountDue <= 0) {
      return NextResponse.json({ error: 'Invoice is already paid' }, { status: 400 })
    }

    const items = (invoice.invoice_items ?? []) as Array<{
      name: string
      description: string | null
      price: number
      quantity: number
    }>

    const amountDueCents = Math.round(amountDue * 100)
    if (amountDueCents < 50) {
      return NextResponse.json({ error: 'Amount due is too small to charge' }, { status: 400 })
    }

    let lineItems: Stripe.Checkout.SessionCreateParams.LineItem[]

    if (items.length === 0) {
      lineItems = [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `Invoice #${String(invoice.id).slice(0, 8)}`,
            },
            unit_amount: amountDueCents,
          },
          quantity: 1,
        },
      ]
    } else {
      lineItems = items.map((item) => ({
        price_data: {
          currency: 'usd',
          product_data: {
            name: item.name.slice(0, 120),
            ...(item.description?.trim()
              ? { description: item.description.trim().slice(0, 500) }
              : {}),
          },
          unit_amount: Math.round(Number(item.price) * 100),
        },
        quantity: Math.max(1, Math.floor(Number(item.quantity) || 1)),
      }))

      const sumCents = items.reduce(
        (sum, item) => sum + Math.round(Number(item.price) * 100) * Math.max(1, Math.floor(Number(item.quantity) || 1)),
        0
      )

      if (Math.abs(sumCents - amountDueCents) > 1) {
        lineItems = [
          {
            price_data: {
              currency: 'usd',
              product_data: {
                name: `Invoice #${String(invoice.id).slice(0, 8)}`,
              },
              unit_amount: amountDueCents,
            },
            quantity: 1,
          },
        ]
      }
    }

    const rawBusiness = invoice.business as unknown
    const businessRow = Array.isArray(rawBusiness) ? rawBusiness[0] : rawBusiness
    const business = businessRow as {
      stripe_account_id: string | null
      stripe_onboarding_completed: boolean | null
    } | null | undefined

    const useConnect = Boolean(
      business?.stripe_account_id && business?.stripe_onboarding_completed === true
    )

    const base = getAppBaseUrl()
    const successUrl = `${base}/invoice/${encodeURIComponent(trimmed)}?paid=true`
    const cancelUrl = `${base}/invoice/${encodeURIComponent(trimmed)}`

    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      mode: 'payment',
      line_items: lineItems,
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        invoiceId: invoice.id,
        token: trimmed,
      },
    }

    if (useConnect && business?.stripe_account_id) {
      sessionParams.payment_intent_data = {
        application_fee_amount: platformFeeCents(amountDueCents),
        transfer_data: {
          destination: business.stripe_account_id,
        },
        metadata: {
          invoiceId: invoice.id,
          token: trimmed,
        },
      }
    } else {
      sessionParams.payment_intent_data = {
        metadata: {
          invoiceId: invoice.id,
          token: trimmed,
        },
      }
    }

    const session = await stripe.checkout.sessions.create(sessionParams)

    if (!session.url) {
      return NextResponse.json({ error: 'Could not create checkout session' }, { status: 500 })
    }

    return NextResponse.json({ checkoutUrl: session.url })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to start checkout'
    console.error('[invoice/pay]', err)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
