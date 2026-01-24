# Schedule Features Update

## New Features Added

### 1. ✅ Recurring Time Blocks

- Time blocks can now be set to repeat daily, weekly, monthly, or yearly
- Options to end recurrence by date or number of occurrences
- Recurring blocks are automatically expanded when viewing the calendar
- Database migration includes new fields: `is_recurring`, `recurrence_pattern`, `recurrence_end_date`, `recurrence_count`

### 2. ✅ Drag and Drop Jobs

- Jobs can now be dragged and dropped between dates in the calendar
- Visual feedback when dragging (calendar cells highlight)
- Job time is preserved when moving to a new date
- Updates are saved immediately to the database

### 3. ✅ Customer Booking Availability

- Booking form now shows only available time slots based on:
  - Business hours (set in Settings → Schedule Settings)
  - Time blocks (personal time, holidays, unavailable periods)
  - Existing scheduled jobs
- Time slots are generated in 30-minute intervals
- Customers can only book during available slots
- Real-time availability checking when submitting booking

## Database Migration Required

**IMPORTANT:** Run the updated migration in Supabase:

```sql
-- Add recurring pattern fields to time_blocks table
ALTER TABLE time_blocks 
ADD COLUMN IF NOT EXISTS is_recurring BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS recurrence_pattern TEXT CHECK (recurrence_pattern IN ('daily', 'weekly', 'monthly', 'yearly')),
ADD COLUMN IF NOT EXISTS recurrence_end_date DATE,
ADD COLUMN IF NOT EXISTS recurrence_count INTEGER;
```

Or run the full updated `database/schedule_migration.sql` file.

## How It Works

### Recurring Time Blocks

1. Click "Block Time" in the schedule
2. Check "Make this recurring"
3. Select pattern (daily/weekly/monthly/yearly)
4. Optionally set end date or number of occurrences
5. The block will repeat automatically on the calendar

### Drag and Drop

1. Hover over a job in the calendar
2. Click and drag the job card
3. Drop it on any date cell
4. The job's date updates automatically (time is preserved)

### Customer Availability

1. Business owner sets hours in Settings → Schedule Settings
2. Business owner blocks time as needed (personal, holidays, etc.)
3. When customers book:
   - They select a date
   - Available time slots load automatically
   - Only available slots are shown
   - Booking validates availability before submission

## Technical Details

- **Recurring blocks**: Expanded client-side when viewing calendar, stored as single records with pattern metadata
- **Drag and drop**: Uses HTML5 drag and drop API, updates via `updateJobDate` server action
- **Availability**: Calculated server-side considering business hours, time blocks (including recurring), and existing jobs
