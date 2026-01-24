import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'

const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2025-12-15.clover',
    })
  : null

export async function POST(request: NextRequest) {
  try {
    if (!stripe || !process.env.STRIPE_SECRET_KEY) {
      return NextResponse.json(
        { error: 'Stripe is not configured on the server' },
        { status: 500 }
      )
    }

    const body = await request.json()
    const { amount, stripeAccountId, businessId, bookingData } = body

    if (!amount || !stripeAccountId || !businessId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    if (amount <= 0) {
      return NextResponse.json(
        { error: 'Invalid amount' },
        { status: 400 }
      )
    }

    // Create payment intent on the platform account
    // Funds will be automatically transferred to the connected account (minus platform fee)
    const platformFee = Math.round(amount * 0.029 + 30) // 2.9% + $0.30

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount), // Amount in cents
      currency: 'usd',
      payment_method_types: ['card'],
      // Store metadata for booking creation
      metadata: {
        business_id: businessId,
        stripe_account_id: stripeAccountId,
      },
      // Platform fee (what we keep)
      application_fee_amount: platformFee,
      // Transfer remaining amount to connected account
      transfer_data: {
        destination: stripeAccountId,
      },
    })

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
    })
  } catch (error: any) {
    console.error('Error creating payment intent:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create payment intent' },
      { status: 500 }
    )
  }
}
