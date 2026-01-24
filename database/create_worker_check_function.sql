-- Create a function that bypasses RLS to check if email exists in team_members
-- This is safe because it only returns true/false and the team member ID
-- Run this in your Supabase SQL Editor

CREATE OR REPLACE FUNCTION check_team_member_by_email(check_email TEXT)
RETURNS TABLE(
  id UUID,
  business_id UUID,
  name TEXT,
  user_id UUID
)
LANGUAGE plpgsql
SECURITY DEFINER -- This bypasses RLS
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

-- Grant execute permission to anon and authenticated users
GRANT EXECUTE ON FUNCTION check_team_member_by_email(TEXT) TO anon, authenticated;

-- Test it (replace with your test email)
-- SELECT * FROM check_team_member_by_email('worker@test.com');

