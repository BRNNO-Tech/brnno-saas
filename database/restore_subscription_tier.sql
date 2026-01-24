-- Restore Subscription Tier After Data Wipe
-- Run this in your Supabase SQL Editor
-- Replace 'YOUR_USER_EMAIL' with your actual email address

-- Option 1: Set to PRO tier (uncomment and run)
UPDATE businesses
SET 
  subscription_plan = 'pro',
  subscription_status = 'active',
  subscription_started_at = NOW(),
  subscription_ends_at = NOW() + INTERVAL '1 year'
WHERE owner_id IN (
  SELECT id FROM auth.users WHERE email = 'YOUR_USER_EMAIL'
);

-- Option 2: Set to STARTER tier (uncomment and run if you prefer)
-- UPDATE businesses
-- SET 
--   subscription_plan = 'starter',
--   subscription_status = 'active',
--   subscription_started_at = NOW(),
--   subscription_ends_at = NOW() + INTERVAL '1 year'
-- WHERE owner_id IN (
--   SELECT id FROM auth.users WHERE email = 'YOUR_USER_EMAIL'
-- );

-- Option 3: Set to FLEET tier (uncomment and run if you prefer)
-- UPDATE businesses
-- SET 
--   subscription_plan = 'fleet',
--   subscription_status = 'active',
--   subscription_started_at = NOW(),
--   subscription_ends_at = NOW() + INTERVAL '1 year'
-- WHERE owner_id IN (
--   SELECT id FROM auth.users WHERE email = 'YOUR_USER_EMAIL'
-- );

-- Verify the update
SELECT 
  b.id,
  b.name,
  b.subscription_plan,
  b.subscription_status,
  u.email as owner_email
FROM businesses b
JOIN auth.users u ON b.owner_id = u.id
WHERE u.email = 'YOUR_USER_EMAIL';
