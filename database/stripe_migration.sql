-- Migration: Add Stripe Connect fields to businesses table
-- Run this in your Supabase SQL Editor

ALTER TABLE businesses 
ADD COLUMN IF NOT EXISTS stripe_account_id TEXT UNIQUE;

ALTER TABLE businesses 
ADD COLUMN IF NOT EXISTS stripe_onboarding_completed BOOLEAN DEFAULT false;

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_businesses_stripe_account_id ON businesses(stripe_account_id);
