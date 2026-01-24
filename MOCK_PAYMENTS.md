# Mock Payments Mode

## Overview

Mock payments mode allows you to test the complete booking flow without requiring Stripe Connect setup. Perfect for development and testing!

## Setup

### 1. Enable Mock Mode

Add to your `.env.local`:

```env
NEXT_PUBLIC_MOCK_PAYMENTS=true
```

### 2. Restart Dev Server

```bash
npm run dev
```

## How It Works

### Mock Mode ON (`NEXT_PUBLIC_MOCK_PAYMENTS=true`)

- ✅ **No Stripe required** - Works without Stripe account connection
- ✅ **Checkout page accessible** - Even if business has no `stripe_account_id`
- ✅ **Booking form redirects** - Goes to checkout regardless of Stripe status
- ✅ **Creates all records** - Client, Job, Invoice (unpaid), Lead
- ✅ **No payment processing** - Invoice created as "unpaid"

### Mock Mode OFF (`NEXT_PUBLIC_MOCK_PAYMENTS=false` or not set)

- ✅ **Stripe required** - Business must have `stripe_account_id`
- ✅ **Real payments** - Uses Stripe payment intents
- ✅ **Invoice marked paid** - After successful payment
- ✅ **Payment record created** - In `payments` table

## What Gets Created

### In Mock Mode

1. **Client** - Created or found by email
2. **Job** - Scheduled appointment
3. **Invoice** - Status: `unpaid`, `paid_amount`: `0`
4. **Invoice Item** - Service line item
5. **Lead** - Status: `converted`, Source: `online_booking`

### In Real Mode

Same as above, plus:

- **Invoice** - Status: `paid`, `paid_amount`: full amount
- **Payment** - Record in `payments` table

## Testing Flow

1. **Set mock mode**: `NEXT_PUBLIC_MOCK_PAYMENTS=true`
2. **Customer books service** → Fills booking form
3. **Redirects to checkout** → Shows mock payment UI
4. **Clicks "Complete Booking"** → Creates all records
5. **Redirects to confirmation** → Success page

## Switching to Production

When ready for real payments:

1. **Set mock mode to false**:

   ```env
   NEXT_PUBLIC_MOCK_PAYMENTS=false
   ```

2. **Have detailers connect Stripe**:
   - Go to Settings → Payments
   - Click "Connect Stripe Account"
   - Complete Stripe onboarding

3. **Test with real payments**:
   - Use Stripe test cards
   - Verify invoices are marked paid
   - Check payment records created

## Files Modified

- ✅ `app/api/create-booking/route.ts` - Handles mock vs real payments
- ✅ `components/booking/checkout-form.tsx` - Shows mock or real payment UI
- ✅ `app/(booking)/[subdomain]/book/checkout/page.tsx` - Allows access in mock mode
- ✅ `components/booking/booking-form.tsx` - Redirects to checkout in mock mode
