-- Activate adrian@brnno.com Admin Account
-- Run this in your Supabase SQL Editor

-- Find Adrian's user ID and activate his business
DO $$
DECLARE
  admin_user_id UUID;
  admin_business_id UUID;
BEGIN
  -- Find Adrian's user
  SELECT id INTO admin_user_id
  FROM auth.users
  WHERE email = 'adrian@brnno.com';
  
  IF admin_user_id IS NULL THEN
    RAISE EXCEPTION 'User adrian@brnno.com not found. User needs to sign up first.';
  END IF;

  -- Find Adrian's business
  SELECT id INTO admin_business_id
  FROM businesses
  WHERE owner_id = admin_user_id
  LIMIT 1;
  
  IF admin_business_id IS NOT NULL THEN
    -- Update existing business to have active subscription
    UPDATE businesses
    SET 
      subscription_status = 'active',
      subscription_plan = 'pro',
      subscription_billing_period = 'monthly',
      subscription_started_at = NOW(),
      subscription_ends_at = NOW() + INTERVAL '1 year'
    WHERE id = admin_business_id;
    
    RAISE NOTICE 'Activated business for adrian@brnno.com (business_id: %)', admin_business_id;
  ELSE
    -- Create a new business for Adrian
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
      'Admin Business - Adrian',
      'adrian@brnno.com',
      'active',
      'pro',
      'monthly',
      NOW(),
      NOW() + INTERVAL '1 year'
    )
    RETURNING id INTO admin_business_id;
    
    RAISE NOTICE 'Created new business for adrian@brnno.com (business_id: %)', admin_business_id;
  END IF;
END $$;

-- Verify the update
SELECT 
  u.email,
  u.id as user_id,
  b.id as business_id,
  b.name as business_name,
  b.subscription_status,
  b.subscription_plan,
  b.subscription_billing_period,
  b.subscription_started_at,
  b.subscription_ends_at
FROM auth.users u
LEFT JOIN businesses b ON b.owner_id = u.id
WHERE u.email = 'adrian@brnno.com';
