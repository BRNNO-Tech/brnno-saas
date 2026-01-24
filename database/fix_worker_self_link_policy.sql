-- Fix: Allow workers to link themselves on first signup
-- Simpler approach - allow updating team_member if user_id is NULL
-- Run this in your Supabase SQL Editor

-- Drop the problematic policy
DROP POLICY IF EXISTS "Users can update their own team member record" ON team_members;

-- Create a simpler policy: allow authenticated users to set user_id if it's currently NULL
CREATE POLICY "Workers can link themselves on signup"
  ON team_members FOR UPDATE
  TO authenticated
  USING (user_id IS NULL)
  WITH CHECK (user_id IS NULL OR user_id = auth.uid());

-- Verify policies
SELECT policyname, cmd, roles
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename = 'team_members'
ORDER BY policyname;

