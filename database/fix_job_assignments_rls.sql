-- Fix: Allow workers to see their job assignments
-- The current policy might have the same recursion issue
-- Run this in your Supabase SQL Editor

-- Check current policies
SELECT policyname, cmd, qual 
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename = 'job_assignments';

-- Drop all existing policies
DO $$ 
DECLARE 
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = 'job_assignments') LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON job_assignments';
    END LOOP;
END $$;

-- Create simple, direct policy for SELECT
CREATE POLICY "Users can view job assignments"
  ON job_assignments FOR SELECT
  TO authenticated
  USING (
    -- Workers can see their own assignments (direct check, no subquery)
    team_member_id IN (
      SELECT id FROM team_members WHERE user_id = auth.uid()
    )
  );

-- Verify
SELECT policyname FROM pg_policies WHERE tablename = 'job_assignments';

