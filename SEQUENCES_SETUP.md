# Sequences (Auto Follow-Up) Setup Guide

## Problem Fixed
The sequences system was showing "0 active" enrollments because:
1. Enrollment functions were missing
2. No automatic enrollment when leads are created
3. No cron job to process sequence steps

## What Was Added

### 1. Enrollment Functions (`lib/actions/sequences.ts`)
- `enrollLeadInSequence()` - Manually enroll a lead into a sequence
- `checkAndEnrollSequences()` - Automatically enroll based on triggers

### 2. Cron Job API Route (`app/api/cron/process-sequences/route.ts`)
- Processes active sequence enrollments
- Executes sequence steps (SMS, email, wait, etc.)
- Should run every 5-15 minutes

### 3. Automatic Enrollment
- When booking leads are created, they're automatically checked for "booking_abandoned" sequences

## How to Set Up

### Step 1: Create a Sequence
1. Go to `/dashboard/leads/sequences`
2. Click "New Auto Follow-Up"
3. Set trigger type (e.g., "booking_abandoned")
4. Add steps (SMS messages, wait times, etc.)
5. **Enable the sequence** (toggle switch)

### Step 2: Set Up Cron Job
Add to `vercel.json`:
```json
{
  "crons": [{
    "path": "/api/cron/process-sequences",
    "schedule": "*/10 * * * *"
  }]
}
```

Or use Vercel Cron dashboard to set up the schedule.

### Step 3: Test Enrollment
1. Create a test lead (or use existing lead)
2. Check if it gets enrolled in matching sequences
3. Wait for cron job to process (or manually call the API)

## Manual Enrollment (if needed)
You can manually enroll a lead by calling:
```typescript
import { enrollLeadInSequence } from '@/lib/actions/sequences'
await enrollLeadInSequence(leadId, sequenceId)
```

## Troubleshooting

### "0 active" still showing?
1. **Check if sequence is enabled** - The toggle must be ON
2. **Check trigger type** - Make sure it matches the event (e.g., "booking_abandoned" for abandoned bookings)
3. **Check if leads match** - The lead must match the sequence's trigger conditions
4. **Check RLS policies** - Make sure sequence_enrollments table has proper RLS policies

### SMS not sending?
1. **Check cron job** - Make sure it's running
2. **Check SMS provider** - Make sure Twilio/Surge is configured
3. **Check phone numbers** - Make sure leads have valid phone numbers
4. **Check logs** - Look for errors in sequence_step_executions table

## Database Check
Run this SQL to see enrollments:
```sql
SELECT 
  s.name as sequence_name,
  COUNT(se.id) as active_enrollments
FROM sequences s
LEFT JOIN sequence_enrollments se ON s.id = se.sequence_id AND se.status = 'active'
WHERE s.enabled = true
GROUP BY s.id, s.name;
```
