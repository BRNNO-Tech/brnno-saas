-- Worker System Setup
-- This file contains all the necessary SQL to set up the worker system
-- Run this in your Supabase SQL Editor

-- ============================================
-- 1. Create function to check team member by email (bypasses RLS for signup)
-- ============================================
CREATE OR REPLACE FUNCTION check_team_member_by_email(check_email TEXT)
RETURNS TABLE(
  id UUID,
  business_id UUID,
  name TEXT,
  user_id UUID
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    tm.id,
    tm.business_id,
    tm.name,
    tm.user_id
  FROM team_members tm
  WHERE LOWER(TRIM(tm.email)) = LOWER(TRIM(check_email))
  LIMIT 1;
END;
$$;

GRANT EXECUTE ON FUNCTION check_team_member_by_email(TEXT) TO anon, authenticated;

-- ============================================
-- 2. Allow workers to link themselves on signup
-- ============================================
DROP POLICY IF EXISTS "Workers can link themselves on signup" ON team_members;

CREATE POLICY "Workers can link themselves on signup"
  ON team_members FOR UPDATE
  TO authenticated
  USING (user_id IS NULL)
  WITH CHECK (user_id IS NULL OR user_id = auth.uid());

-- ============================================
-- 3. Allow workers to view their job assignments
-- ============================================
DROP POLICY IF EXISTS "Users can view job assignments of their business" ON job_assignments;

CREATE POLICY "Users can view job assignments"
  ON job_assignments FOR SELECT
  TO authenticated
  USING (
    team_member_id IN (
      SELECT id FROM team_members WHERE user_id = auth.uid()
    )
  );

-- ============================================
-- 4. RLS is now properly configured
-- Note: RLS was previously disabled for MVP, but should now be enabled
-- Run fix_rls_clients_jobs.sql to properly enable RLS with correct policies
-- ============================================
-- RLS is now handled by fix_rls_clients_jobs.sql
-- DO NOT disable RLS here - it's a security requirement

-- ============================================
-- Verification
-- ============================================
SELECT 'Worker system setup complete!' as status;

-- Check that function exists
SELECT proname FROM pg_proc WHERE proname = 'check_team_member_by_email';

-- Check policies
SELECT tablename, policyname 
FROM pg_policies 
WHERE tablename IN ('team_members', 'job_assignments')
ORDER BY tablename, policyname;

