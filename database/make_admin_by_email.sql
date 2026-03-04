-- Make a user an admin by email
-- Run this in Supabase SQL Editor (Dashboard → SQL Editor).
--
-- Prerequisites:
-- 1. The user must already exist in auth.users (create via Supabase Dashboard
--    Authentication → Add user, or have them sign up first).
-- 2. Replace 'your-admin@example.com' below with the actual email.
--
-- This script:
-- 1. Creates the admin_users table if it doesn't exist.
-- 2. Looks up the user by email in auth.users and inserts into admin_users.
--    (If the email is already in admin_users, the insert is skipped.)

-- Create table if not exists (used by app/dashboard/admin and Settings Channels tab)
CREATE TABLE IF NOT EXISTS public.admin_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Optional: allow authenticated users to read their own row (for admin check)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'admin_users' AND policyname = 'Users can check if they are admin'
  ) THEN
    CREATE POLICY "Users can check if they are admin"
      ON public.admin_users FOR SELECT
      USING (auth.uid() = user_id);
  END IF;
  -- Service role / RLS bypass: app uses createClient() which gets user JWT, so SELECT is enough
EXCEPTION
  WHEN duplicate_object THEN NULL; -- policy already exists
END $$;

-- Add admin by email (run this block; change the email)
DO $$
DECLARE
  target_email TEXT := 'your-admin@example.com';  -- ← Change this
  found_user_id UUID;
BEGIN
  SELECT id INTO found_user_id
  FROM auth.users
  WHERE email = target_email
  LIMIT 1;

  IF found_user_id IS NULL THEN
    RAISE EXCEPTION 'User not found with email: %. Create the user in Authentication first.', target_email;
  END IF;

  INSERT INTO public.admin_users (user_id)
  VALUES (found_user_id)
  ON CONFLICT (user_id) DO NOTHING;

  RAISE NOTICE 'Admin added: % (user_id: %)', target_email, found_user_id;
END $$;
