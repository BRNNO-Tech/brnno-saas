-- Fix: Align job_assignments table with the application code
-- Run this in Supabase SQL Editor

-- 1. Remove conflicting 'assigned_by' column if it exists (causes relationship errors)
DO $$ 
BEGIN 
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'job_assignments' AND column_name = 'assigned_by') THEN
        ALTER TABLE job_assignments DROP COLUMN assigned_by;
    END IF;
END $$;

-- 2. Ensure 'status' column exists
ALTER TABLE job_assignments ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'assigned';

-- 3. Ensure 'assigned_at' column exists
ALTER TABLE job_assignments ADD COLUMN IF NOT EXISTS assigned_at TIMESTAMPTZ DEFAULT NOW();

-- 4. Ensure RLS policies are correct (Re-run of previous policies to be safe)
ALTER TABLE job_assignments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view assignments for their business jobs" ON job_assignments;
CREATE POLICY "Users can view assignments for their business jobs"
  ON job_assignments FOR SELECT
  USING (
    job_id IN (
      SELECT id FROM jobs WHERE business_id IN (
        SELECT id FROM businesses WHERE owner_id = auth.uid()
      )
    )
  );

DROP POLICY IF EXISTS "Users can insert assignments for their business jobs" ON job_assignments;
CREATE POLICY "Users can insert assignments for their business jobs"
  ON job_assignments FOR INSERT
  WITH CHECK (
    job_id IN (
      SELECT id FROM jobs WHERE business_id IN (
        SELECT id FROM businesses WHERE owner_id = auth.uid()
      )
    )
  );

DROP POLICY IF EXISTS "Users can update assignments for their business jobs" ON job_assignments;
CREATE POLICY "Users can update assignments for their business jobs"
  ON job_assignments FOR UPDATE
  USING (
    job_id IN (
      SELECT id FROM jobs WHERE business_id IN (
        SELECT id FROM businesses WHERE owner_id = auth.uid()
      )
    )
  );

DROP POLICY IF EXISTS "Users can delete assignments for their business jobs" ON job_assignments;
CREATE POLICY "Users can delete assignments for their business jobs"
  ON job_assignments FOR DELETE
  USING (
    job_id IN (
      SELECT id FROM jobs WHERE business_id IN (
        SELECT id FROM businesses WHERE owner_id = auth.uid()
      )
    )
  );
