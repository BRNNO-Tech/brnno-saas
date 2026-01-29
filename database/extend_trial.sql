-- Extend a customer's trial
-- Run in Supabase: Dashboard → SQL Editor
--
-- IMPORTANT: Replace 'customer@example.com' with the customer's EXACT login email
-- (the one they use to sign in). If the UPDATE affects 0 rows, the email didn't match.

-- ========== STEP 1: Find the customer (run this first to verify email) ==========
-- You should see exactly one row. If 0 rows, the email is wrong or they have no business.
SELECT
  u.id AS user_id,
  u.email,
  b.id AS business_id,
  b.name AS business_name,
  b.subscription_plan,
  b.subscription_status,
  b.subscription_ends_at,
  (b.subscription_ends_at IS NOT NULL AND b.subscription_ends_at > NOW()) AS trial_still_valid
FROM auth.users u
LEFT JOIN businesses b ON b.owner_id = u.id
WHERE u.email = 'customer@example.com';

-- ========== STEP 2: Extend the trial (same email as above) ==========
-- Replace the email and the number of days (14) as needed, then run.
UPDATE businesses
SET
  subscription_status = 'trialing',
  subscription_ends_at = GREATEST(
    COALESCE(subscription_ends_at, NOW()),
    NOW()
  ) + INTERVAL '14 days'
WHERE owner_id IN (
  SELECT id FROM auth.users WHERE email = 'customer@example.com'
);

-- ========== STEP 3: Verify it worked (run after the UPDATE) ==========
-- subscription_status should be 'trialing', subscription_ends_at should be in the future
SELECT
  b.id,
  b.name,
  b.subscription_plan,
  b.subscription_status,
  b.subscription_ends_at,
  (b.subscription_ends_at > NOW()) AS trial_now_valid
FROM businesses b
JOIN auth.users u ON b.owner_id = u.id
WHERE u.email = 'customer@example.com';

-- ========== ALTERNATIVE: Extend by business ID ==========
-- If you know the business ID from the Table Editor (businesses.id):
-- UPDATE businesses
-- SET
--   subscription_status = 'trialing',
--   subscription_ends_at = NOW() + INTERVAL '14 days'
-- WHERE id = 'paste-business-uuid-here';

-- ========== If subscription_ends_at column is missing ==========
-- Run database/subscription_migration.sql first to add subscription columns.
