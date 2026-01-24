# Free Trial Setup Guide

## Overview

Users can now start a 14-day free trial without providing payment information. The trial gives full access to all features of the selected plan.

## How It Works

1. **User Signup Flow**: During signup (Step 4), users can choose to:
   - **Start Free Trial**: Creates account and business with trial status (14 days), no payment required
   - **Continue to Payment**: Traditional flow with Stripe checkout

2. **Trial Period**: 
   - Duration: 14 days
   - Status: `trialing` in `subscription_status` column
   - Full feature access during trial period

3. **After Trial**:
   - User needs to add payment method to continue
   - Subscription converts to paid status
   - If no payment added, subscription becomes inactive

## Implementation Details

### API Endpoint
- **Route**: `/api/start-trial`
- **Method**: POST
- **Creates**: Business record with `subscription_status = 'trialing'`
- **Sets**: `subscription_ends_at` to 14 days from start

### Database
- Uses existing `subscription_status` column (supports 'trialing')
- Trial end date stored in `subscription_ends_at`
- No additional migrations needed

### User Flow
1. User completes signup steps 1-3
2. User selects plan in step 4
3. User clicks "Start Free Trial (14 Days)" button
4. Account and business created with trial status
5. User redirected to dashboard
6. Trial expires after 14 days (handled by subscription management)

## Next Steps (Future Enhancements)

- Add trial expiration notifications
- Create payment setup page for trial conversion
- Add trial status indicator in dashboard
- Handle trial expiration webhooks
