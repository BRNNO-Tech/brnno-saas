# Stripe Subscription Setup Guide

## Overview

This guide explains how to set up Stripe subscriptions for the business signup flow. After completing signup steps 1-3, users select a plan and are redirected to Stripe Checkout to pay for their subscription.

## Setup Steps

### 1. Create Stripe Products and Prices

You need to create products and prices in your Stripe Dashboard for each plan:

#### Starter Plan
- **Product Name**: Starter
- **Monthly Price**: $79/month (flat rate)
- **Yearly Price**: $790/year (flat rate)

#### Pro Plan
- **Product Name**: Pro (Base)
- **Monthly Price**: $149/month (includes 1-2 technicians)
- **Yearly Price**: $1,490/year (includes 1-2 technicians)
- **Product Name**: Pro Extra Technician
- **Monthly Price**: $50/month (for 3rd technician)
- **Yearly Price**: $500/year (for 3rd technician)
- **Note**: Pro includes up to 2 technicians at $149/mo. Add a 3rd technician for $50/mo.

#### Fleet Plan
- **Product Name**: Fleet (Base)
- **Monthly Price**: $299/month (includes 1-3 technicians)
- **Yearly Price**: $2,990/year (includes 1-3 technicians)
- **Product Name**: Fleet Extra Technician
- **Monthly Price**: $50/month (per technician for 4th and 5th)
- **Yearly Price**: $500/year (per technician for 4th and 5th)
- **Note**: Fleet includes up to 3 technicians at $299/mo. Add technicians 4–5 for $50/mo each.

### 2. Get Price IDs

After creating products and prices in Stripe:

1. Go to [Stripe Dashboard → Products](https://dashboard.stripe.com/products)
2. Click on each product
3. Copy the **Price ID** for each billing period (starts with `price_...`)
4. **Important**: Create separate products for:
   - Base subscription prices (Starter, Pro base, Fleet base)
   - Extra technician add-ons (Pro extra tech, Fleet extra tech)

### 3. Add Environment Variables

Add these to your `.env.local` and Vercel environment variables:

```env
# Stripe Subscription Base Price IDs
STRIPE_STARTER_MONTHLY_PRICE_ID=price_xxxxx
STRIPE_STARTER_YEARLY_PRICE_ID=price_xxxxx
STRIPE_PRO_MONTHLY_PRICE_ID=price_xxxxx
STRIPE_PRO_YEARLY_PRICE_ID=price_xxxxx
STRIPE_FLEET_MONTHLY_PRICE_ID=price_xxxxx
STRIPE_FLEET_YEARLY_PRICE_ID=price_xxxxx

# Extra Technician Price IDs (for Pro and Fleet)
STRIPE_PRO_EXTRA_TECH_MONTHLY_PRICE_ID=price_xxxxx
STRIPE_PRO_EXTRA_TECH_YEARLY_PRICE_ID=price_xxxxx
STRIPE_FLEET_EXTRA_TECH_MONTHLY_PRICE_ID=price_xxxxx
STRIPE_FLEET_EXTRA_TECH_YEARLY_PRICE_ID=price_xxxxx

# Stripe Webhook Secret (for production)
STRIPE_WEBHOOK_SECRET=whsec_xxxxx
```

### 4. Set Up Webhook Endpoint

1. Go to [Stripe Dashboard → Webhooks](https://dashboard.stripe.com/webhooks)
2. Click "Add endpoint"
3. Set endpoint URL to: `https://yourdomain.com/api/webhooks/stripe`
4. Select events to listen for:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
5. Copy the **Signing secret** (starts with `whsec_...`)
6. Add it to `STRIPE_WEBHOOK_SECRET` environment variable

### 5. Run Database Migration

Run the SQL migration to add subscription columns:

```bash
# Run in Supabase SQL Editor
database/subscription_migration.sql
```

Or manually run:

```sql
ALTER TABLE businesses 
ADD COLUMN IF NOT EXISTS subscription_plan TEXT,
ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'inactive',
ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT,
ADD COLUMN IF NOT EXISTS subscription_billing_period TEXT,
ADD COLUMN IF NOT EXISTS subscription_started_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS subscription_ends_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS team_size INTEGER DEFAULT 1;
```

## How It Works

### Signup Flow

1. **Step 1-3**: User completes account, business, and customization info
2. **Step 4**: 
   - User selects subscription plan (Starter/Pro/Fleet) and billing period (Monthly/Yearly)
   - For Pro: Selects team size (1-3 technicians)
   - For Fleet: Selects team size (1-5 technicians)
   - Dynamic pricing calculated based on team size
3. **Checkout**: User is redirected to Stripe Checkout to pay (with line items for base + extra technicians)
4. **Webhook**: After payment, Stripe sends webhook to create business record with team size
5. **Success**: User is redirected to success page, then dashboard

### Webhook Processing

When `checkout.session.completed` event is received:

1. Extracts user ID, plan ID, and signup data from session metadata
2. Retrieves subscription details from Stripe
3. Creates business record with all signup information
4. Marks subscription as `active`
5. Stores subscription details (ID, customer ID, billing period, dates)

### Subscription Updates

- **`customer.subscription.updated`**: Updates subscription status and end date
- **`customer.subscription.deleted`**: Marks subscription as `canceled`

## Testing

### Test Cards

Use Stripe test cards for testing:

- **Success**: `4242 4242 4242 4242`
- **Decline**: `4000 0000 0000 0002`
- Any future expiry date, any CVC

### Test Webhook

1. Use Stripe CLI to forward webhooks locally:
   ```bash
   stripe listen --forward-to localhost:3000/api/webhooks/stripe
   ```
2. Trigger test events:
   ```bash
   stripe trigger checkout.session.completed
   ```

## Troubleshooting

### Business Not Created After Payment

- Check webhook logs in Stripe Dashboard
- Verify `STRIPE_WEBHOOK_SECRET` is set correctly
- Check server logs for webhook processing errors
- Ensure database migration was run

### Price ID Errors

- Verify all price IDs are set in environment variables
- Check that prices exist in Stripe Dashboard
- Ensure prices are for subscriptions (not one-time payments)

### Webhook Not Receiving Events

- Verify webhook endpoint URL is correct
- Check that events are selected in Stripe Dashboard
- Test with Stripe CLI locally
- Check server logs for incoming requests

## Next Steps

After setup:

1. Test the full signup flow end-to-end
2. Monitor webhook events in Stripe Dashboard
3. Set up email notifications for subscription events
4. Add subscription management UI in dashboard settings

