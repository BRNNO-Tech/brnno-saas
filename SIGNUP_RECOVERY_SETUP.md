# Signup Recovery Funnel Setup

This document explains how to set up the signup recovery funnel system that tracks abandoned signups and sends recovery emails.

## Overview

The signup recovery funnel:
1. **Captures email early** - Creates a lead record as soon as email is entered in Step 1
2. **Tracks progress** - Records completion of each signup step
3. **Detects abandonment** - Marks leads as abandoned when users leave before completing
4. **Sends recovery emails** - Automatically sends follow-up emails at 1hr, 24hr, and 72hr after abandonment
5. **Marks conversions** - Updates lead status when subscription is completed

## Database Setup

1. Run the migration SQL in your Supabase SQL Editor:

```sql
-- Run: database/signup_leads_migration.sql
```

This creates the `signup_leads` table with all necessary columns and indexes.

## Environment Variables

Make sure you have these environment variables set:

```env
# Required
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
RESEND_API_KEY=your_resend_api_key
RESEND_FROM_EMAIL=noreply@yourdomain.com

# Optional (for cron job security)
CRON_SECRET=your_random_secret_string

# Optional (for email links)
NEXT_PUBLIC_APP_URL=https://app.yourdomain.com
```

## Cron Job Setup

The recovery email system requires a scheduled job to run periodically. Here are setup options:

### Option 1: Vercel Cron (Recommended)

If you're using Vercel, add this to `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/cron/send-signup-recovery",
      "schedule": "0 * * * *"
    }
  ]
}
```

This runs every hour. The cron job will:
- Find abandoned signups from at least 1 hour ago
- Send recovery emails based on timing (1hr, 24hr, 72hr)
- Update recovery email counts

**Security**: Set `CRON_SECRET` in your Vercel environment variables, and the cron job will verify the `Authorization` header.

### Option 2: External Cron Service

You can use any cron service (cron-job.org, EasyCron, etc.) to hit:

```
GET https://yourdomain.com/api/cron/send-signup-recovery
Authorization: Bearer YOUR_CRON_SECRET
```

Schedule it to run every hour.

### Option 3: Manual Testing

You can manually trigger the cron job for testing:

```bash
curl -X GET https://yourdomain.com/api/cron/send-signup-recovery \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

## How It Works

### 1. Email Collection (Step 1)

When a user enters their email in the signup form:
- A lead record is created in `signup_leads` table
- `step_1_completed_at` is set
- `current_step` is set to 1

### 2. Progress Tracking

As users complete each step:
- Step 2 (Account): `step_2_completed_at` is set, `name` is saved
- Step 3 (Business): `step_3_completed_at` is set
- Step 4 (Customization): `step_4_completed_at` is set
- Step 5 (Subscription): Plan selection is saved

### 3. Abandonment Detection

If a user leaves before completing Step 4:
- `abandoned_at_step` is set (e.g., "email_collected", "account_created")
- `abandoned_at` timestamp is recorded
- Lead becomes eligible for recovery emails

### 4. Recovery Email Schedule

The cron job sends recovery emails at:
- **1 hour** after abandonment (first email)
- **24 hours** after abandonment (second email)
- **72 hours** after abandonment (third email)

Each email includes:
- Personalized message based on the step where they abandoned
- Direct link to continue signup (pre-filled with their email)
- Clear call-to-action

### 5. Conversion Tracking

When a user completes payment via Stripe:
- The webhook handler marks the lead as `converted: true`
- `converted_at` timestamp is set
- Lead is excluded from future recovery emails

## Monitoring & Analytics

### Query Abandoned Leads

```sql
SELECT 
  email,
  name,
  current_step,
  abandoned_at_step,
  abandoned_at,
  recovery_emails_sent,
  last_recovery_email_at
FROM signup_leads
WHERE converted = false
  AND abandoned_at IS NOT NULL
ORDER BY abandoned_at DESC;
```

### Query Conversion Rates

```sql
SELECT 
  abandoned_at_step,
  COUNT(*) as total_abandoned,
  SUM(CASE WHEN converted THEN 1 ELSE 0 END) as converted,
  ROUND(100.0 * SUM(CASE WHEN converted THEN 1 ELSE 0 END) / COUNT(*), 2) as conversion_rate
FROM signup_leads
WHERE abandoned_at IS NOT NULL
GROUP BY abandoned_at_step
ORDER BY total_abandoned DESC;
```

### Query Recovery Email Effectiveness

```sql
SELECT 
  recovery_emails_sent,
  COUNT(*) as total_leads,
  SUM(CASE WHEN converted THEN 1 ELSE 0 END) as converted,
  ROUND(100.0 * SUM(CASE WHEN converted THEN 1 ELSE 0 END) / COUNT(*), 2) as conversion_rate
FROM signup_leads
WHERE abandoned_at IS NOT NULL
GROUP BY recovery_emails_sent
ORDER BY recovery_emails_sent;
```

## Email Customization

Edit recovery email content in `lib/email.ts`:

```typescript
const stepMessages: Record<number, string> = {
  1: 'Your custom message for step 1...',
  2: 'Your custom message for step 2...',
  // etc.
}
```

## Testing

1. **Test Lead Creation**: Start a signup, enter email, check `signup_leads` table
2. **Test Abandonment**: Start signup, leave before completing, verify `abandoned_at` is set
3. **Test Recovery Email**: Manually trigger cron job, verify email is sent
4. **Test Conversion**: Complete signup, verify lead is marked as converted

## Troubleshooting

### Emails Not Sending

- Check `RESEND_API_KEY` is set correctly
- Verify `RESEND_FROM_EMAIL` is a verified domain in Resend
- Check cron job is running (check Vercel logs or cron service logs)
- Verify `SUPABASE_SERVICE_ROLE_KEY` is set

### Leads Not Being Created

- Check browser console for errors
- Verify API route `/api/signup/create-lead` is accessible
- Check Supabase RLS policies allow inserts

### Conversion Not Marked

- Verify `signupLeadId` is passed to checkout session
- Check Stripe webhook is receiving `checkout.session.completed` events
- Verify webhook handler is updating `signup_leads` table

## Next Steps

1. **Analytics Dashboard**: Build a dashboard to visualize funnel drop-off
2. **A/B Testing**: Test different recovery email copy
3. **Segmentation**: Send different emails based on selected plan
4. **Onboarding Recovery**: Add emails for users who sign up but don't activate

