-- Verify leads table has all required columns for booking flow
-- Run this in your Supabase SQL Editor to check table structure

-- Check if required columns exist
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'leads'
  AND column_name IN (
    'booking_progress',
    'abandoned_at_step',
    'preferred_date',
    'preferred_time',
    'source',
    'interested_in_service_id',
    'interested_in_service_name',
    'estimated_value',
    'score'
  )
ORDER BY column_name;

-- If any columns are missing, you'll need to add them:
-- Example (only run if columns are missing):

-- ALTER TABLE leads 
-- ADD COLUMN IF NOT EXISTS booking_progress INTEGER DEFAULT 0,
-- ADD COLUMN IF NOT EXISTS abandoned_at_step TEXT,
-- ADD COLUMN IF NOT EXISTS preferred_date DATE,
-- ADD COLUMN IF NOT EXISTS preferred_time TIME;

-- Verify RLS is enabled (optional - service role bypasses RLS anyway)
SELECT 
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename = 'leads';

