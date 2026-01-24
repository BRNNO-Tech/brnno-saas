-- Fix: Complete RLS policies for job_assignments
-- This allows both business owners to manage assignments AND workers to view their own
-- Run this in your Supabase SQL Editor

-- Drop all existing policies
DO $$ 
DECLARE 
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = 'job_assignments') LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON job_assignments';
    END LOOP;
END $$;

-- Enable RLS
ALTER TABLE job_assignments ENABLE ROW LEVEL SECURITY;

-- Policy 1: Workers can view their own assignments
CREATE POLICY "Workers can view their assignments"
  ON job_assignments FOR SELECT
  TO authenticated
  USING (
    team_member_id IN (
      SELECT id FROM team_members WHERE user_id = auth.uid()
    )
  );

-- Policy 2: Business owners can view assignments for their jobs
CREATE POLICY "Business owners can view assignments"
  ON job_assignments FOR SELECT
  TO authenticated
  USING (
    job_id IN (
      SELECT j.id FROM jobs j
      JOIN businesses b ON j.business_id = b.id
      WHERE b.owner_id = auth.uid()
    )
  );

-- Policy 3: Business owners can insert assignments for their jobs
CREATE POLICY "Business owners can insert assignments"
  ON job_assignments FOR INSERT
  TO authenticated
  WITH CHECK (
    job_id IN (
      SELECT j.id FROM jobs j
      JOIN businesses b ON j.business_id = b.id
      WHERE b.owner_id = auth.uid()
    )
  );

-- Policy 4: Business owners can update assignments for their jobs
CREATE POLICY "Business owners can update assignments"
  ON job_assignments FOR UPDATE
  TO authenticated
  USING (
    job_id IN (
      SELECT j.id FROM jobs j
      JOIN businesses b ON j.business_id = b.id
      WHERE b.owner_id = auth.uid()
    )
  );

-- Policy 5: Business owners can delete assignments for their jobs
CREATE POLICY "Business owners can delete assignments"
  ON job_assignments FOR DELETE
  TO authenticated
  USING (
    job_id IN (
      SELECT j.id FROM jobs j
      JOIN businesses b ON j.business_id = b.id
      WHERE b.owner_id = auth.uid()
    )
  );

-- Verify policies
SELECT policyname, cmd FROM pg_policies 
WHERE schemaname = 'public' AND tablename = 'job_assignments'
ORDER BY cmd, policyname;

