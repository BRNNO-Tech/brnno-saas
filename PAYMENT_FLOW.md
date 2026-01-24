# Customer Payment Flow

## Overview

Complete end-to-end payment flow where customers can book and pay for services online.

## Flow

1. **Customer selects service** → Booking landing page
2. **Customer fills booking form** → Date, time, contact info
3. **Redirects to checkout** → If business has Stripe connected
4. **Customer pays** → Stripe payment form
5. **Booking created** → Client, Job, Invoice, Lead created
6. **Confirmation page** → Success message

## Files Created

### Pages

- ✅ `app/(booking)/[subdomain]/book/checkout/page.tsx` - Checkout page
- ✅ `app/(booking)/[subdomain]/book/confirmation/page.tsx` - Confirmation page

### Components

- ✅ `components/booking/checkout-form.tsx` - Stripe payment form with order summary

### API Routes

- ✅ `app/api/create-payment-intent/route.ts` - Creates Stripe payment intent
- ✅ `app/api/create-booking/route.ts` - Creates booking after payment

### Updated

- ✅ `components/booking/booking-form.tsx` - Redirects to checkout with booking data

## How It Works

### 1. Booking Form Submission

- Customer fills out form with name, email, phone, date, time, notes
- Form validates availability
- If business has Stripe: saves data to `sessionStorage` and redirects to checkout
- If no Stripe: shows alert and redirects to landing page

### 2. Checkout Page

- Loads booking data from `sessionStorage`
- Creates Stripe payment intent via API
- Shows order summary and Stripe payment form
- Customer enters payment details

### 3. Payment Processing

- Stripe processes payment
- Funds go to business's Stripe account (minus 2.9% + $0.30 platform fee)
- Payment intent succeeds

### 4. Booking Creation

After successful payment:

- **Client**: Created or updated (by email)
- **Job**: Created with scheduled date/time
- **Invoice**: Created and marked as paid
- **Lead**: Created with status "converted" (for analytics)

### 5. Confirmation

- Redirects to confirmation page
- Shows success message
- Clears sessionStorage

## Stripe Connect Details

- **Payment Intent**: Created on platform account
- **Platform Fee**: 2.9% + $0.30 per transaction
- **Transfer**: Remaining amount automatically transferred to connected account
- **Metadata**: Business ID and account ID stored for reference

## Database Records Created

1. **clients** - Customer information
2. **jobs** - Scheduled appointment
3. **invoices** - Payment record (status: paid)
4. **invoice_items** - Service line item
5. **leads** - Analytics record (status: converted, source: online_booking)

## Environment Variables Required

```env
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Testing

1. Business owner connects Stripe account (Settings → Payments)
2. Customer visits booking page
3. Selects service and fills form
4. Redirects to checkout
5. Uses test card: `4242 4242 4242 4242`
6. Any future expiry date, any CVC
7. Payment processes
8. Booking appears in dashboard
9. Invoice marked as paid

## Error Handling

- **No Stripe account**: Shows message, allows booking without payment
- **Payment fails**: Shows error, allows retry
- **Booking creation fails**: Shows error, payment still processed (manual follow-up needed)
- **Missing data**: Redirects back to booking form
