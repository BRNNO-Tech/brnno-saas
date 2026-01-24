-- Cleanup Old Firebase Sync Trigger
-- Run this in Supabase SQL Editor to remove the conflicting trigger

-- Drop the existing trigger
DROP TRIGGER IF EXISTS "sync-provider-to-firestore" ON auth.users;

-- Also check for and drop any other similar triggers
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS sync_to_firebase_trigger ON auth.users;

-- Optional: Drop the function if it exists (only if you're not using it)
-- Uncomment the line below if you want to remove the function too
-- DROP FUNCTION IF EXISTS call_sync_to_firebase();

-- Verify triggers are removed
SELECT 
  trigger_name, 
  event_object_table, 
  event_manipulation
FROM information_schema.triggers 
WHERE event_object_table = 'users' 
  AND event_object_schema = 'auth'
  AND trigger_name LIKE '%firebase%' OR trigger_name LIKE '%sync%';

-- If the query above returns no rows, all sync triggers have been removed successfully!
