# Stripe Connect Setup Guide

## Overview

Stripe Connect allows your customers to pay you directly through the booking system. Money goes straight to your Stripe account (minus Stripe's fees).

## Setup Steps

### 1. ✅ Install Stripe Packages

Already completed! The following packages are installed:

- `stripe` - Server-side Stripe SDK
- `@stripe/stripe-js` - Client-side Stripe SDK

### 2. Get Stripe API Keys

1. Go to [Stripe Dashboard](https://dashboard.stripe.com/test/apikeys)
2. Copy your **Secret Key** (starts with `sk_test_...`)
3. Copy your **Publishable Key** (starts with `pk_test_...`)

### 3. Add Environment Variables

Add these to your `.env.local` file:

```env
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**For production**, update:

- Use live keys (starts with `sk_live_` and `pk_live_`)
- Set `NEXT_PUBLIC_APP_URL` to your production URL (e.g., `https://yourdomain.com`)

### 4. Run Database Migration

Run this SQL in your Supabase SQL Editor:

```sql
ALTER TABLE businesses 
ADD COLUMN IF NOT EXISTS stripe_account_id TEXT UNIQUE;

ALTER TABLE businesses 
ADD COLUMN IF NOT EXISTS stripe_onboarding_completed BOOLEAN DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_businesses_stripe_account_id ON businesses(stripe_account_id);
```

Or run the full migration file: `database/stripe_migration.sql`

### 5. How It Works

1. **Business owner** goes to Settings → Payments tab
2. Clicks **"Connect Stripe Account"**
3. Redirected to Stripe's onboarding flow
4. Completes business information, bank details, etc.
5. Redirected back to your app with `?stripe=success`
6. Account is marked as connected and active

### 6. Features

- **Express Accounts**: Fast onboarding (5-10 minutes)
- **Direct Payouts**: Money goes directly to your bank account
- **Account Management**: Click "Manage Stripe Account" to access Stripe dashboard
- **Status Tracking**: Shows connection status (Connected/Setup Incomplete)

### 7. Testing

1. Use Stripe test mode keys
2. Use test card numbers from [Stripe Testing](https://stripe.com/docs/testing)
3. Test the full onboarding flow
4. Verify redirects work correctly

### 8. Production Checklist

- [ ] Switch to live Stripe keys
- [ ] Update `NEXT_PUBLIC_APP_URL` to production URL
- [ ] Test onboarding flow in production
- [ ] Verify webhook endpoints (if needed)
- [ ] Set up Stripe webhooks for payment events

## Files Created/Modified

- ✅ `lib/actions/stripe-connect.ts` - Stripe Connect server actions
- ✅ `app/dashboard/settings/page.tsx` - Updated Payments tab with Stripe UI
- ✅ `database/stripe_migration.sql` - Database migration

## Next Steps

After Stripe is connected, you can:

- Accept payments in the booking flow
- Process refunds
- View transactions in Stripe dashboard
- Set up automatic payouts
