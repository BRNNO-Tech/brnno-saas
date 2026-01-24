-- Setup Admin Users - Bypass Subscription Requirements
-- Run this in your Supabase SQL Editor
-- 
-- Instructions:
-- 1. Replace the email addresses below with your 3 admin emails
-- 2. Run this script
-- 3. The script will:
--    - Find users by email
--    - Update their businesses to have active subscriptions
--    - Set them to a plan (you can change the plan if needed)

-- Replace these with your actual admin email addresses
DO $$
DECLARE
  admin_emails TEXT[] := ARRAY[
    'john@brnno.com',  -- Replace with first admin email
    'adrian@brnno.com',   -- Replace with second admin email
    'sam@brnno.com'   -- Replace with third admin email
    'skylar@brnno.com'
    'austin@brnno.com'
    'brandon@brnno.com'

  ];
  admin_email TEXT;
  admin_user_id UUID;
  admin_business_id UUID;
BEGIN
  FOREACH admin_email IN ARRAY admin_emails
  LOOP
    -- Find user by email
    SELECT id INTO admin_user_id
    FROM auth.users
    WHERE email = admin_email;
    
    IF admin_user_id IS NOT NULL THEN
      -- Find or create business for this admin
      SELECT id INTO admin_business_id
      FROM businesses
      WHERE owner_id = admin_user_id
      LIMIT 1;
      
      IF admin_business_id IS NOT NULL THEN
        -- Update existing business to have active subscription
        UPDATE businesses
        SET 
          subscription_status = 'active',
          subscription_plan = 'pro',  -- Change to 'starter', 'pro', or 'fleet' as needed
          subscription_billing_period = 'monthly',
          subscription_started_at = NOW(),
          subscription_ends_at = NOW() + INTERVAL '1 year'  -- Set to 1 year from now
        WHERE id = admin_business_id;
        
        RAISE NOTICE 'Updated business for admin: % (user_id: %, business_id: %)', 
          admin_email, admin_user_id, admin_business_id;
      ELSE
        -- Create a new business for this admin user
        INSERT INTO businesses (
          owner_id,
          name,
          email,
          subscription_status,
          subscription_plan,
          subscription_billing_period,
          subscription_started_at,
          subscription_ends_at
        )
        VALUES (
          admin_user_id,
          'Admin Business - ' || split_part(admin_email, '@', 1),  -- Use email prefix as business name
          admin_email,
          'active',
          'pro',  -- Change to 'starter', 'pro', or 'fleet' as needed
          'monthly',
          NOW(),
          NOW() + INTERVAL '1 year'
        )
        RETURNING id INTO admin_business_id;
        
        RAISE NOTICE 'Created business for admin: % (user_id: %, business_id: %)', 
          admin_email, admin_user_id, admin_business_id;
      END IF;
    ELSE
      RAISE NOTICE 'User not found: %. User needs to sign up first.', admin_email;
    END IF;
  END LOOP;
END $$;

-- Verify the updates
SELECT 
  u.email,
  b.name as business_name,
  b.subscription_status,
  b.subscription_plan,
  b.subscription_billing_period,
  b.subscription_started_at,
  b.subscription_ends_at
FROM auth.users u
JOIN businesses b ON b.owner_id = u.id
WHERE u.email IN (
  'john@brnno.com',  -- Replace with your admin emails
  'adrian@brnno.com',
  'sam@brnno.com'
)
ORDER BY u.email;

