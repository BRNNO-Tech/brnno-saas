# Smart Notifications System

A proactive notification system that detects scheduling opportunities and customer patterns to help maximize bookings.

---

## **Features**

✅ **Empty Priority Slot Alerts** - Notifies about unfilled priority blocks in the next 7 days  
✅ **Customer Overdue Alerts** - Tracks customer booking patterns and alerts when they're overdue  
✅ **Gap Opportunity Alerts** - Finds 2+ hour gaps between jobs perfect for quick details  
✅ **Dismiss/Snooze/Act** - Users can take action, snooze for 24h, or dismiss notifications  
✅ **Priority Levels** - High/medium/low priority based on urgency  
✅ **Collapsible UI** - Can minimize to floating bell icon  

---

## **Setup Instructions**

### 1. Database Migration

Run the migration to create the `smart_notifications` table:

```bash
# In Supabase SQL Editor
Run: database/create_smart_notifications_table.sql
```

This creates:

- `smart_notifications` table with RLS policies
- Indexes for performance (business_id, status, type, created_at)
- Auto-update trigger for `updated_at` timestamp

### 2. Implementation

The system is already integrated into the schedule page at:

- **Page**: `app/dashboard/schedule/page.tsx`
- **Component**: `components/notifications/smart-notifications-banner.tsx`
- **Actions**: `lib/actions/notifications.ts`
- **Types**: `types/notifications.ts`

---

## **How It Works**

### Empty Priority Slot Detection

Checks each enabled priority block for the next 7 days:

- Scans all priority blocks with `enabled = true`
- For each day matching the block's days array (e.g., `['monday', 'wednesday']`)
- Checks if any jobs are scheduled during that priority block time range
- Creates notification if slot is empty and in the future
- **Priority**: High if within 24 hours, Medium otherwise

**Example Notification:**

```
Title: "Priority Slot Available"
Message: "VIP Morning Slot on Wed, Jan 29 at 09:00 is still open. 
         Notify leads about this high paying customer slot?"
Priority: High (if tomorrow) / Medium (if 2+ days away)
```

### Customer Overdue Detection

Analyzes customer booking patterns:

1. Builds job history for each customer from completed jobs
2. Calculates average interval between bookings (needs 2+ jobs)
3. Determines if customer is 20% past their expected booking interval
4. Creates notification when customer is overdue

- **Priority**: High if 50% overdue, Medium if 20-50% overdue

**Example Notification:**

```
Title: "Customer Overdue for Rebooking"
Message: "John Smith typically books every 2.5 months, but it's been 
         3.2 months since their last detail. Time to reach out?"
Priority: Medium
Metadata: { customer_phone: "+1234567890", days_overdue: 21 }
```

### Gap Opportunity Detection

Finds scheduling inefficiencies:

1. Sorts upcoming scheduled jobs by date/time
2. Calculates end time of each job (scheduled_date + estimated_duration)
3. Finds gaps of 2+ hours between consecutive jobs on the same day
4. Creates notification suggesting filling the gap

- **Priority**: Medium if 3+ hours, Low if 2-3 hours

**Example Notification:**

```
Title: "Scheduling Gap Detected"
Message: "3.5-hour gap on Tue, Jan 28 between 11:30 AM and 3:00 PM. 
         Perfect for a quick detail!"
Priority: Medium
Metadata: { gap_minutes: 210, gap_start: "...", gap_end: "..." }
```

---

## **Notification Actions**

### User Actions

1. **Take Action** - Marks as "acted" and removes from view
   - Empty Slot → Opens lead notification tool (TODO)
   - Customer Overdue → Opens SMS/email compose (TODO)
   - Gap Opportunity → Opens quick booking form (TODO)

2. **Snooze 24h** - Hides notification for 24 hours
   - Sets `status = 'snoozed'`
   - Sets `snoozed_until = now() + 24 hours`
   - Notification reappears after 24 hours

3. **Dismiss** - Permanently removes notification
   - Sets `status = 'dismissed'`
   - Won't appear again

### Automatic Generation

Notifications are generated on every schedule page load:

- Runs `generateSmartNotifications()` with current data
- Checks for duplicate notifications before inserting
- Only creates new notifications if similar one doesn't exist
- Uses metadata comparison to avoid duplicates

---

## **API Reference**

### Server Actions

```typescript
// Get active notifications for current business
await getSmartNotifications()
// Returns: Array<SmartNotification>

// Generate new notifications
await generateSmartNotifications(
  businessId: string,
  jobs: any[],
  priorityBlocks: any[],
  customers: any[]
)

// User actions
await dismissNotification(notificationId: string)
await snoozeNotification(notificationId: string, hours?: number)
await markNotificationActed(notificationId: string)
```

### Component Props

```typescript
<SmartNotificationsBanner 
  initialNotifications={notifications} 
/>
```

---

## **Database Schema**

```sql
smart_notifications (
  id                uuid PRIMARY KEY,
  business_id       uuid REFERENCES businesses(id) ON DELETE CASCADE,
  type              text NOT NULL,
  title             text NOT NULL,
  message           text NOT NULL,
  priority          text DEFAULT 'medium',
  status            text DEFAULT 'active',
  metadata          jsonb,
  snoozed_until     timestamptz,
  created_at        timestamptz DEFAULT now(),
  updated_at        timestamptz DEFAULT now()
)
```

**Indexes:**

- `business_id` (for RLS queries)
- `status` (for filtering active)
- `type` (for categorization)
- `created_at DESC` (for ordering)

**RLS Policies:**

- Users can only view/modify their own business notifications
- Based on `businesses.owner_id = auth.uid()`

---

## **UI Components**

### Notification Banner

Displays at top of schedule page:

- Color-coded by priority (red=high, amber=medium, blue=low)
- Icon per type (Clock, Bell, TrendingUp)
- Action buttons (Take Action, Snooze, Dismiss X)
- Timestamp of notification creation
- Collapsible to floating bell icon with badge count

### Collapsed State

When user clicks "Collapse notifications":

- Minimizes to floating blue button at bottom-right
- Shows red badge with notification count
- Click to expand back to full view

---

## **Future Enhancements**

### Action Implementations (TODO)

1. **Empty Priority Slot → SMS Blast**
   - Modal to select leads from database
   - Template: "We have a [priority_for] slot available on [date] at [time]. Book now!"
   - Send via Twilio to selected leads

2. **Customer Overdue → Contact Customer**
   - Pre-fill SMS/email with customer info
   - Template: "Hi [name], it's been [months] since your last detail. Ready to book again?"
   - One-click send

3. **Gap Opportunity → Quick Book**
   - Open booking modal pre-filled with gap time slot
   - Show suitable services that fit in gap duration
   - Quick search for customer to fill slot

### Advanced Features

- **Email Digests**: Daily summary of notifications
- **Custom Thresholds**: Let users set overdue percentages
- **Webhook Integration**: Send to Slack/Discord
- **Mobile Push**: Native mobile app notifications
- **AI Recommendations**: Suggest best customers for each slot

---

## **Testing**

### Test Empty Priority Slot

1. Create a priority block for tomorrow
2. Don't schedule any jobs during that time
3. Reload schedule page
4. Should see notification about empty slot

### Test Customer Overdue

1. Create customer with 2+ completed jobs
2. Set job dates 60 and 120 days ago (avg = 60 days)
3. Set last job date to 90+ days ago (50% overdue)
4. Reload schedule page
5. Should see overdue notification

### Test Gap Opportunity

1. Schedule job at 9:00 AM (1 hour duration)
2. Schedule next job at 1:00 PM on same day
3. Reload schedule page
4. Should see 3-hour gap notification

---

## **Performance Considerations**

- Notifications are generated server-side on page load
- Duplicate check prevents notification spam
- Indexes optimize queries for large datasets
- Limited to 10 most recent active notifications
- Snoozed notifications auto-reappear after timeout

---

## **Troubleshooting**

**No notifications appearing:**

- Check if `smart_notifications` table exists
- Verify RLS policies allow access
- Check browser console for errors
- Ensure priority blocks are enabled
- Verify jobs have `scheduled_date` and `completed_at` fields

**Duplicate notifications:**

- Check metadata comparison logic
- Ensure notifications are being dismissed/acted upon
- Verify database trigger is updating `updated_at`

**Wrong priority levels:**

- Check time calculations in notification generation
- Verify dates are in correct timezone
- Review priority threshold logic (24h for high, etc.)

---

Your calendar is now **proactive** instead of reactive! 🔔
