-- Create a function to check if a user can access a job
-- This avoids recursion in RLS policies
-- Run this in your Supabase SQL Editor

CREATE OR REPLACE FUNCTION user_can_access_job(job_id_param UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
  can_access BOOLEAN;
BEGIN
  -- Check if user is business owner of this job
  SELECT EXISTS (
    SELECT 1 FROM jobs j
    JOIN businesses b ON j.business_id = b.id
    WHERE j.id = job_id_param
    AND b.owner_id = auth.uid()
  ) INTO can_access;
  
  IF can_access THEN
    RETURN TRUE;
  END IF;
  
  -- Check if user is a worker assigned to this job
  SELECT EXISTS (
    SELECT 1 FROM job_assignments ja
    JOIN team_members tm ON ja.team_member_id = tm.id
    WHERE ja.job_id = job_id_param
    AND tm.user_id = auth.uid()
  ) INTO can_access;
  
  RETURN can_access;
END;
$$;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION user_can_access_job(UUID) TO authenticated;

-- Now enable RLS and create simple policy using the function
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;

-- Drop all existing policies
DO $$ 
DECLARE 
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = 'jobs') LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON jobs';
    END LOOP;
END $$;

-- Create simple policy using the function
CREATE POLICY "Users can access their jobs"
  ON jobs FOR SELECT
  TO authenticated
  USING (user_can_access_job(id));

-- Verify
SELECT policyname FROM pg_policies WHERE tablename = 'jobs';

