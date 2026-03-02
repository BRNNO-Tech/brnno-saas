-- Billing: new columns on businesses + billing_items + stripe_customers
-- Run once in Supabase SQL Editor (or as a migration). Safe to re-run (IF NOT EXISTS).

-- New columns on businesses (parallel to legacy subscription_* columns)
ALTER TABLE businesses
  ADD COLUMN IF NOT EXISTS billing_plan TEXT,
  ADD COLUMN IF NOT EXISTS billing_interval TEXT,
  ADD COLUMN IF NOT EXISTS modules JSONB,
  ADD COLUMN IF NOT EXISTS platform_fee_item_id TEXT;

COMMENT ON COLUMN businesses.billing_plan IS 'New model: free | pro';
COMMENT ON COLUMN businesses.billing_interval IS 'monthly | yearly';
COMMENT ON COLUMN businesses.modules IS 'Module flags from Stripe subscription items (leadRecovery, jobs, etc.)';
COMMENT ON COLUMN businesses.platform_fee_item_id IS 'Stripe subscription item ID for platform fee';

-- Table: one row per subscription item per business (synced by webhook)
CREATE TABLE IF NOT EXISTS billing_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  module TEXT NOT NULL,
  stripe_price_id TEXT NOT NULL,
  stripe_subscription_item_id TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_billing_items_business_id ON billing_items(business_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_billing_items_business_item ON billing_items(business_id, stripe_subscription_item_id);

COMMENT ON TABLE billing_items IS 'Current Stripe subscription items per business; synced on subscription webhooks';

-- Table: user_id -> stripe_customer_id for checkout/portal (upserted by webhook)
CREATE TABLE IF NOT EXISTS stripe_customers (
  user_id UUID PRIMARY KEY,
  stripe_customer_id TEXT NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE stripe_customers IS 'Maps auth user_id to Stripe customer ID; used by subscription webhook';
