# Schedule/Calendar Feature Setup

## Overview

A calendar view for detailers to see all their bookings, block personal time, and manage their schedule - similar to the reference image you showed.

## Database Setup

**IMPORTANT:** Run the SQL migration in Supabase before using the schedule feature.

1. Go to your Supabase project → SQL Editor
2. Open and run: `database/schedule_migration.sql`
3. This creates:
   - `time_blocks` table (for personal time, holidays, unavailable periods)
   - `business_hours` column on `businesses` table (JSONB for weekly schedule)
   - RLS policies for security

## Features

### 1. Schedule Page (`/dashboard/schedule`)

- **Monthly calendar view** showing all jobs and time blocks
- **View toggles**: Daily, Weekly, Monthly (currently only Monthly is implemented)
- **Navigation**: Previous/Next month, "Today" button
- **Visual indicators**:
  - Jobs: Blue blocks with time and price
  - Personal time: Grey blocks
  - Unavailable/Sick: Red blocks with border
  - Holidays: Green text labels

### 2. Time Block Management

- Click **"Block Time"** button to add personal time, holidays, or mark unavailable
- Hover over time blocks to see delete button (X icon)
- Types:
  - **Personal**: Regular personal time (e.g., "Gym time")
  - **Holiday**: Special days (e.g., "Christmas", "Christmas Eve")
  - **Unavailable**: Sick days, time off, etc.

### 3. Business Hours Settings

- Go to **Settings → Schedule Settings** tab
- Set weekly business hours (Mon-Sun)
- Mark days as "Closed"
- Set open/close times for each day
- Used for customer booking availability (future feature)

## How It Works

1. **Jobs** from your `jobs` table (status: scheduled/in_progress) appear as blue blocks
2. **Time blocks** you create appear as grey/red blocks
3. **Holidays** appear as green text labels at the top of the day
4. Calendar automatically loads data for the current month
5. Navigate months to see different time periods

## Next Steps (Future Enhancements)

- **Customer-side availability**: Use business hours + time blocks to show available slots
- **Weekly/Daily views**: Implement the view toggle functionality
- **Drag & drop**: Move jobs between dates
- **Recurring time blocks**: Set recurring personal time (e.g., "Gym time every day 7-8am")
- **Calendar sync**: Export to Google Calendar, iCal, etc.

## Files Created

- `app/dashboard/schedule/page.tsx` - Schedule page
- `components/schedule/schedule-calendar.tsx` - Calendar component
- `components/schedule/add-time-block-dialog.tsx` - Add time block dialog
- `lib/actions/schedule.ts` - Server actions for schedule data
- `database/schedule_migration.sql` - Database migration

## Navigation

Schedule has been added to the dashboard sidebar navigation (between Services and Jobs).
