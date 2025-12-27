-- Fix: Allow users to create their own business during signup
-- Run this in your Supabase SQL Editor

-- Enable RLS on businesses table
ALTER TABLE businesses ENABLE ROW LEVEL SECURITY;

-- Drop all existing policies to start fresh
DO $$ 
DECLARE 
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = 'businesses') LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON businesses';
    END LOOP;
END $$;

-- Policy 1: Users can view their own business
CREATE POLICY "Users can view their own business"
  ON businesses FOR SELECT
  TO authenticated
  USING (owner_id = auth.uid());

-- Policy 2: Users can create their own business (for signup)
CREATE POLICY "Users can create their own business"
  ON businesses FOR INSERT
  TO authenticated
  WITH CHECK (owner_id = auth.uid());

-- Policy 3: Users can update their own business
CREATE POLICY "Users can update their own business"
  ON businesses FOR UPDATE
  TO authenticated
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

-- Policy 4: Users can delete their own business
CREATE POLICY "Users can delete their own business"
  ON businesses FOR DELETE
  TO authenticated
  USING (owner_id = auth.uid());

-- Verify policies
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'businesses'
ORDER BY policyname;

