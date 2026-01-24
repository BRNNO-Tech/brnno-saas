-- Fix RLS for clients and jobs tables
-- This script fixes the Supabase Security Advisor warnings:
-- - "Policy Exists RLS Disabled" 
-- - "RLS Disabled in Public"
-- 
-- Run this in your Supabase SQL Editor
-- Safe to run multiple times (idempotent)

-- ============================================
-- 1. Enable RLS on both tables
-- ============================================
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 2. Drop existing policies (if any) to start fresh
-- ============================================
DO $$ 
DECLARE 
    r RECORD;
BEGIN
    -- Drop all existing policies on clients
    FOR r IN (SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = 'clients') LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON clients';
    END LOOP;
    
    -- Drop all existing policies on jobs
    FOR r IN (SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = 'jobs') LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON jobs';
    END LOOP;
END $$;

-- ============================================
-- 3. Create RLS policies for CLIENTS table
-- ============================================

-- Business owners can view their own clients
CREATE POLICY "Business owners can view their clients"
  ON clients FOR SELECT
  TO authenticated
  USING (
    business_id IN (
      SELECT id FROM businesses WHERE owner_id = auth.uid()
    )
  );

-- Business owners can insert clients
CREATE POLICY "Business owners can insert clients"
  ON clients FOR INSERT
  TO authenticated
  WITH CHECK (
    business_id IN (
      SELECT id FROM businesses WHERE owner_id = auth.uid()
    )
  );

-- Business owners can update their clients
CREATE POLICY "Business owners can update their clients"
  ON clients FOR UPDATE
  TO authenticated
  USING (
    business_id IN (
      SELECT id FROM businesses WHERE owner_id = auth.uid()
    )
  )
  WITH CHECK (
    business_id IN (
      SELECT id FROM businesses WHERE owner_id = auth.uid()
    )
  );

-- Business owners can delete their clients
CREATE POLICY "Business owners can delete their clients"
  ON clients FOR DELETE
  TO authenticated
  USING (
    business_id IN (
      SELECT id FROM businesses WHERE owner_id = auth.uid()
    )
  );

-- ============================================
-- 4. Create helper function for jobs (if it doesn't exist)
-- ============================================
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

GRANT EXECUTE ON FUNCTION user_can_access_job(UUID) TO authenticated;

-- ============================================
-- 5. Create RLS policies for JOBS table
-- ============================================

-- Business owners can view their jobs
CREATE POLICY "Business owners can view their jobs"
  ON jobs FOR SELECT
  TO authenticated
  USING (
    business_id IN (
      SELECT id FROM businesses WHERE owner_id = auth.uid()
    )
  );

-- Workers can view jobs they're assigned to
CREATE POLICY "Workers can view assigned jobs"
  ON jobs FOR SELECT
  TO authenticated
  USING (
    id IN (
      SELECT ja.job_id 
      FROM job_assignments ja
      JOIN team_members tm ON ja.team_member_id = tm.id
      WHERE tm.user_id = auth.uid()
    )
  );

-- Business owners can insert jobs
CREATE POLICY "Business owners can insert jobs"
  ON jobs FOR INSERT
  TO authenticated
  WITH CHECK (
    business_id IN (
      SELECT id FROM businesses WHERE owner_id = auth.uid()
    )
  );

-- Business owners can update their jobs
CREATE POLICY "Business owners can update their jobs"
  ON jobs FOR UPDATE
  TO authenticated
  USING (
    business_id IN (
      SELECT id FROM businesses WHERE owner_id = auth.uid()
    )
  )
  WITH CHECK (
    business_id IN (
      SELECT id FROM businesses WHERE owner_id = auth.uid()
    )
  );

-- Business owners can delete their jobs
CREATE POLICY "Business owners can delete their jobs"
  ON jobs FOR DELETE
  TO authenticated
  USING (
    business_id IN (
      SELECT id FROM businesses WHERE owner_id = auth.uid()
    )
  );

-- ============================================
-- 6. Verification queries
-- ============================================
-- Check RLS status
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN ('clients', 'jobs')
ORDER BY tablename;

-- Check policies
SELECT 
  tablename,
  policyname,
  cmd as operation
FROM pg_policies 
WHERE schemaname = 'public' 
  AND tablename IN ('clients', 'jobs')
ORDER BY tablename, policyname;

-- Success message
SELECT '✅ RLS setup complete! All security issues should be resolved.' as status;
