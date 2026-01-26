# Smart Notifications - Quick Start

## 1️⃣ Run Database Migration

```sql
-- In Supabase SQL Editor, run:
database/create_smart_notifications_table.sql
```

This creates the `smart_notifications` table with all necessary indexes and RLS policies.

---

## 2️⃣ How Notifications Appear

Notifications automatically appear at the top of your schedule page when:

### 🕐 Empty Priority Slot (Next 7 Days)

- You have an enabled priority block
- No jobs are scheduled during that block
- **Action**: Send SMS to leads about the slot

### 👤 Customer Overdue

- Customer has 2+ completed jobs (pattern established)
- They're 20%+ past their typical rebooking interval
- **Action**: Contact customer to rebook

### 📊 Scheduling Gap (2+ Hours)

- Two consecutive jobs on same day have 2+ hour gap
- **Action**: Fill gap with quick detail

---

## 3️⃣ User Actions

Each notification has 3 options:

1. **Take Action** ⚡
   - Marks notification as handled
   - Opens relevant tool (coming soon: SMS, booking form)
   - Removes from view

2. **Snooze 24h** 😴
   - Hides notification for 24 hours
   - Reappears automatically after timeout

3. **Dismiss ✕**
   - Permanently removes notification
   - Won't appear again

---

## 4️⃣ Notification Priority

**🔴 High Priority** (Red)

- Empty priority slot within 24 hours
- Customer 50%+ overdue

**🟡 Medium Priority** (Amber)

- Empty priority slot 2-7 days away
- Customer 20-50% overdue
- Gap opportunity 3+ hours

**🔵 Low Priority** (Blue)

- Gap opportunity 2-3 hours

---

## 5️⃣ Collapse/Expand

- Click **"Collapse notifications"** to minimize to floating bell 🔔
- Badge shows notification count
- Click bell to expand back to full view

---

## 6️⃣ Example Scenarios

### Scenario 1: VIP Slot Tomorrow

```
🔴 HIGH PRIORITY
Priority Slot Available

VIP Morning Slot on Wed, Jan 29 at 09:00 is still open. 
Notify leads about this high paying customer slot?

[Take Action] [Snooze 24h]               Jan 28, 3:45 PM  [✕]
```

### Scenario 2: Repeat Customer Late

```
🟡 MEDIUM PRIORITY
Customer Overdue for Rebooking

Sarah Johnson typically books every 2.0 months, but it's been 
2.8 months since their last detail. Time to reach out?

[Take Action] [Snooze 24h]               Jan 28, 3:45 PM  [✕]
```

### Scenario 3: Fill the Gap

```
🔵 LOW PRIORITY
Scheduling Gap Detected

2.5-hour gap on Thu, Jan 30 between 10:00 AM and 12:30 PM. 
Perfect for a quick detail!

[Take Action] [Snooze 24h]               Jan 28, 3:45 PM  [✕]
```

---

## 7️⃣ Integration Points

### Schedule Page

- Notifications appear above calendar
- Auto-generated on page load
- Uses real-time data from jobs, priority blocks, customers

### Data Requirements

- **Jobs**: Must have `scheduled_date`, `completed_at`, `estimated_duration`
- **Priority Blocks**: Must be `enabled = true`
- **Customers**: Must have `name`, `phone` for overdue alerts

---

## 8️⃣ Customization

### Adjust Overdue Threshold

In `lib/actions/notifications.ts`, line ~120:

```typescript
const overdueThreshold = expectedInterval * 1.2 // 20% past expected
```

Change `1.2` to:

- `1.1` = 10% past expected (more sensitive)
- `1.5` = 50% past expected (less sensitive)

### Adjust Gap Detection

In `lib/actions/notifications.ts`, line ~185:

```typescript
if (gapMinutes >= 120) { // 2+ hour gap
```

Change `120` to:

- `90` = 1.5 hour gaps
- `180` = 3+ hour gaps only

### Adjust Days Ahead

In `lib/actions/notifications.ts`, line ~48:

```typescript
sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7)
```

Change `7` to:

- `3` = Only check next 3 days
- `14` = Check next 2 weeks

---

## 9️⃣ Monitoring

### Check Active Notifications

```sql
SELECT * FROM smart_notifications 
WHERE business_id = 'your-business-id' 
AND status = 'active' 
ORDER BY created_at DESC;
```

### View Notification Stats

```sql
SELECT 
  type, 
  priority, 
  COUNT(*) as count 
FROM smart_notifications 
WHERE business_id = 'your-business-id' 
GROUP BY type, priority;
```

### Clear Old Notifications

```sql
DELETE FROM smart_notifications 
WHERE status IN ('dismissed', 'acted') 
AND updated_at < NOW() - INTERVAL '30 days';
```

---

## 🔟 Troubleshooting

**No notifications showing up?**

- ✅ Run database migration
- ✅ Create priority blocks and enable them
- ✅ Have 2+ completed jobs for customers
- ✅ Check browser console for errors

**Too many notifications?**

- Adjust thresholds (see Customization above)
- Use Dismiss/Snooze more frequently
- Increase gap threshold to 3+ hours

**Notifications not updating?**

- Refresh the schedule page
- Check `updated_at` trigger is working
- Verify notification generation runs on load

---

**You're all set!** The system will now proactively alert you to booking opportunities. 🚀
