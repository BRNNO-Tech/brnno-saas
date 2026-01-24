-- Remove the entire invite system from the database
-- Run this in your Supabase SQL Editor

-- 1. Drop all invite-related policies
DROP POLICY IF EXISTS "Anyone can view businesses with valid invites" ON businesses;
DROP POLICY IF EXISTS "Anyone can view team members with valid invites" ON team_members;
DROP POLICY IF EXISTS "Public can view team members with pending invites" ON team_members;
DROP POLICY IF EXISTS "Public can view businesses with pending invites" ON businesses;
DROP POLICY IF EXISTS "Business owners can manage invites" ON team_invites;
DROP POLICY IF EXISTS "Anyone can view valid invites by token" ON team_invites;
DROP POLICY IF EXISTS "Public can view valid invites by token" ON team_invites;

-- 2. Drop the function if it exists
DROP FUNCTION IF EXISTS get_invite_by_token(TEXT);

-- 3. Drop the team_invites table
DROP TABLE IF EXISTS team_invites CASCADE;

-- 4. Verify cleanup
SELECT 'Cleanup complete!' as status;

-- Show remaining tables
SELECT tablename 
FROM pg_tables 
WHERE schemaname = 'public' 
ORDER BY tablename;

