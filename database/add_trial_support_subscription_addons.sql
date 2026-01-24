-- Migration: Add trial support to business_subscription_addons
-- Run this in your Supabase SQL Editor

-- Add trial_ends_at column to track when trials expire
ALTER TABLE business_subscription_addons
  ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMPTZ;

-- Update status constraint to include 'trial' status
ALTER TABLE business_subscription_addons
  DROP CONSTRAINT IF EXISTS business_subscription_addons_status_check;

ALTER TABLE business_subscription_addons
  ADD CONSTRAINT business_subscription_addons_status_check 
  CHECK (status IN ('active', 'canceled', 'past_due', 'trial'));

-- Add index for efficient trial expiration queries
CREATE INDEX IF NOT EXISTS business_subscription_addons_trial_ends_at_idx 
  ON business_subscription_addons(trial_ends_at) 
  WHERE trial_ends_at IS NOT NULL;

-- Add index for checking trial eligibility (business + addon_key + trial_ends_at)
CREATE INDEX IF NOT EXISTS business_subscription_addons_trial_eligibility_idx 
  ON business_subscription_addons(business_id, addon_key, trial_ends_at) 
  WHERE trial_ends_at IS NOT NULL;

-- Add comment for documentation
COMMENT ON COLUMN business_subscription_addons.trial_ends_at IS 'Timestamp when a trial subscription add-on expires. NULL for non-trial subscriptions.';
