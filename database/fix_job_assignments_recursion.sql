-- Fix: Resolve infinite recursion in job_assignments RLS policies
-- The issue: jobs RLS queries job_assignments, and job_assignments RLS queries jobs
-- Solution: Use SECURITY DEFINER functions to bypass RLS when checking permissions
-- Run this in your Supabase SQL Editor

-- ============================================
-- 1. Create helper functions that bypass RLS
-- ============================================

-- Function to check if a job belongs to a user's business (bypasses RLS)
CREATE OR REPLACE FUNCTION job_belongs_to_user_business(job_id_param UUID, user_id_param UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM jobs j
    JOIN businesses b ON j.business_id = b.id
    WHERE j.id = job_id_param
    AND b.owner_id = user_id_param
  );
END;
$$;

-- Function to check if a user is a team member (bypasses RLS)
CREATE OR REPLACE FUNCTION user_is_team_member(team_member_id_param UUID, user_id_param UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM team_members tm
    WHERE tm.id = team_member_id_param
    AND tm.user_id = user_id_param
  );
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION job_belongs_to_user_business(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION user_is_team_member(UUID, UUID) TO authenticated;

-- ============================================
-- 2. Drop all existing job_assignments policies
-- ============================================
DO $$ 
DECLARE 
    r RECORD;
BEGIN
    FOR r IN (
        SELECT policyname 
        FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'job_assignments'
    ) LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON job_assignments';
    END LOOP;
END $$;

-- ============================================
-- 3. Create new policies using the helper functions
-- ============================================

-- Enable RLS
ALTER TABLE job_assignments ENABLE ROW LEVEL SECURITY;

-- Policy 1: Workers can view their own assignments
CREATE POLICY "Workers can view their assignments"
  ON job_assignments FOR SELECT
  TO authenticated
  USING (
    user_is_team_member(team_member_id, auth.uid())
  );

-- Policy 2: Business owners can view assignments for their jobs
CREATE POLICY "Business owners can view assignments"
  ON job_assignments FOR SELECT
  TO authenticated
  USING (
    job_belongs_to_user_business(job_id, auth.uid())
  );

-- Policy 3: Business owners can insert assignments for their jobs
CREATE POLICY "Business owners can insert assignments"
  ON job_assignments FOR INSERT
  TO authenticated
  WITH CHECK (
    job_belongs_to_user_business(job_id, auth.uid())
  );

-- Policy 4: Business owners can update assignments for their jobs
CREATE POLICY "Business owners can update assignments"
  ON job_assignments FOR UPDATE
  TO authenticated
  USING (
    job_belongs_to_user_business(job_id, auth.uid())
  )
  WITH CHECK (
    job_belongs_to_user_business(job_id, auth.uid())
  );

-- Policy 5: Business owners can delete assignments for their jobs
CREATE POLICY "Business owners can delete assignments"
  ON job_assignments FOR DELETE
  TO authenticated
  USING (
    job_belongs_to_user_business(job_id, auth.uid())
  );

-- ============================================
-- 4. Update user_can_access_job function to use helper
-- ============================================

-- Update the function to use the helper function (which bypasses RLS)
CREATE OR REPLACE FUNCTION user_can_access_job(job_id_param UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
  can_access BOOLEAN;
BEGIN
  -- Check if user is business owner of this job (bypasses RLS)
  SELECT job_belongs_to_user_business(job_id_param, auth.uid()) INTO can_access;
  
  IF can_access THEN
    RETURN TRUE;
  END IF;
  
  -- Check if user is a worker assigned to this job
  -- Use a direct query that bypasses RLS by using SECURITY DEFINER
  SELECT EXISTS (
    SELECT 1 
    FROM job_assignments ja
    JOIN team_members tm ON ja.team_member_id = tm.id
    WHERE ja.job_id = job_id_param
    AND tm.user_id = auth.uid()
  ) INTO can_access;
  
  RETURN can_access;
END;
$$;

-- ============================================
-- 5. Verification
-- ============================================
-- Check policies
SELECT 
  tablename,
  policyname,
  cmd as operation
FROM pg_policies 
WHERE schemaname = 'public' 
  AND tablename = 'job_assignments'
ORDER BY cmd, policyname;

-- Check functions
SELECT 
  routine_name,
  routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name IN ('job_belongs_to_user_business', 'user_is_team_member', 'user_can_access_job')
ORDER BY routine_name;

SELECT '✅ RLS recursion fix complete! Policies should no longer cause infinite recursion.' as status;
