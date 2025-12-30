-- Add subscription columns to businesses table
-- Run this in your Supabase SQL Editor

ALTER TABLE businesses 
ADD COLUMN IF NOT EXISTS subscription_plan TEXT,
ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'inactive',
ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT,
ADD COLUMN IF NOT EXISTS subscription_billing_period TEXT,
ADD COLUMN IF NOT EXISTS subscription_started_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS subscription_ends_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS team_size INTEGER DEFAULT 1;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_businesses_stripe_subscription_id ON businesses(stripe_subscription_id);
CREATE INDEX IF NOT EXISTS idx_businesses_stripe_customer_id ON businesses(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_businesses_subscription_status ON businesses(subscription_status);

-- Add comment for documentation
COMMENT ON COLUMN businesses.subscription_plan IS 'Plan ID: starter, pro, or fleet';
COMMENT ON COLUMN businesses.subscription_status IS 'Status: inactive, active, canceled, past_due, trialing';
COMMENT ON COLUMN businesses.subscription_billing_period IS 'Billing period: monthly or yearly';

