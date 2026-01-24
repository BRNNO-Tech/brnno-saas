-- Migration: Add Schedule/Calendar features
-- Run this in your Supabase SQL Editor

-- 1. Create time_blocks table for personal time, holidays, and unavailable periods
CREATE TABLE IF NOT EXISTS time_blocks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('personal', 'holiday', 'unavailable')),
  description TEXT,
  -- Recurring pattern fields
  is_recurring BOOLEAN DEFAULT false,
  recurrence_pattern TEXT CHECK (recurrence_pattern IN ('daily', 'weekly', 'monthly', 'yearly')),
  recurrence_end_date DATE,
  recurrence_count INTEGER, -- Number of occurrences (alternative to end_date)
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_time_blocks_business_id ON time_blocks(business_id);
CREATE INDEX IF NOT EXISTS idx_time_blocks_start_time ON time_blocks(start_time);
CREATE INDEX IF NOT EXISTS idx_time_blocks_end_time ON time_blocks(end_time);

-- 2. Add business_hours column to businesses table (JSONB for flexible weekly schedule)
ALTER TABLE businesses 
ADD COLUMN IF NOT EXISTS business_hours JSONB;

-- 3. Enable RLS on time_blocks
ALTER TABLE time_blocks ENABLE ROW LEVEL SECURITY;

-- 4. Create RLS policies for time_blocks
-- Policy: Users can only see their own business's time blocks
CREATE POLICY "Users can view their own business time blocks"
  ON time_blocks FOR SELECT
  USING (
    business_id IN (
      SELECT id FROM businesses WHERE owner_id = auth.uid()
    )
  );

-- Policy: Users can insert time blocks for their own business
CREATE POLICY "Users can insert time blocks for their own business"
  ON time_blocks FOR INSERT
  WITH CHECK (
    business_id IN (
      SELECT id FROM businesses WHERE owner_id = auth.uid()
    )
  );

-- Policy: Users can update time blocks for their own business
CREATE POLICY "Users can update their own business time blocks"
  ON time_blocks FOR UPDATE
  USING (
    business_id IN (
      SELECT id FROM businesses WHERE owner_id = auth.uid()
    )
  );

-- Policy: Users can delete time blocks for their own business
CREATE POLICY "Users can delete their own business time blocks"
  ON time_blocks FOR DELETE
  USING (
    business_id IN (
      SELECT id FROM businesses WHERE owner_id = auth.uid()
    )
  );

-- Example business_hours structure (stored as JSONB):
-- {
--   "monday": { "open": "09:00", "close": "17:00", "closed": false },
--   "tuesday": { "open": "09:00", "close": "17:00", "closed": false },
--   "wednesday": { "open": "09:00", "close": "17:00", "closed": false },
--   "thursday": { "open": "09:00", "close": "17:00", "closed": false },
--   "friday": { "open": "09:00", "close": "17:00", "closed": false },
--   "saturday": { "open": "10:00", "close": "14:00", "closed": false },
--   "sunday": { "closed": true }
-- }
