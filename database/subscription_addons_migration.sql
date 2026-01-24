-- Subscription Add-Ons Migration
-- Creates table to track business-level subscription add-ons (e.g., Mileage Tracker)
-- These are separate from service add-ons that customers select during booking

CREATE TABLE IF NOT EXISTS business_subscription_addons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE NOT NULL,
  addon_key TEXT NOT NULL, -- e.g., 'mileage_tracker'
  stripe_subscription_item_id TEXT UNIQUE, -- Stripe subscription item ID (null for trials)
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'canceled', 'past_due', 'trial')),
  started_at TIMESTAMPTZ DEFAULT NOW(),
  canceled_at TIMESTAMPTZ,
  trial_ends_at TIMESTAMPTZ, -- For trial subscriptions
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(business_id, addon_key)
);

-- Enable RLS
ALTER TABLE business_subscription_addons ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Business owners can view their subscription add-ons"
  ON business_subscription_addons FOR SELECT
  USING (business_id IN (SELECT id FROM businesses WHERE owner_id = auth.uid()));

CREATE POLICY "Business owners can insert subscription add-ons"
  ON business_subscription_addons FOR INSERT
  WITH CHECK (business_id IN (SELECT id FROM businesses WHERE owner_id = auth.uid()));

CREATE POLICY "Business owners can update their subscription add-ons"
  ON business_subscription_addons FOR UPDATE
  USING (business_id IN (SELECT id FROM businesses WHERE owner_id = auth.uid()));

CREATE POLICY "Business owners can delete their subscription add-ons"
  ON business_subscription_addons FOR DELETE
  USING (business_id IN (SELECT id FROM businesses WHERE owner_id = auth.uid()));

-- Indexes for performance
CREATE INDEX IF NOT EXISTS business_subscription_addons_business_id_idx ON business_subscription_addons(business_id);
CREATE INDEX IF NOT EXISTS business_subscription_addons_addon_key_idx ON business_subscription_addons(addon_key);
CREATE INDEX IF NOT EXISTS business_subscription_addons_status_idx ON business_subscription_addons(status);
CREATE INDEX IF NOT EXISTS business_subscription_addons_stripe_item_idx ON business_subscription_addons(stripe_subscription_item_id) WHERE stripe_subscription_item_id IS NOT NULL;

-- Comments for documentation
COMMENT ON TABLE business_subscription_addons IS 'Tracks business-level subscription add-ons (recurring features like Mileage Tracker)';
COMMENT ON COLUMN business_subscription_addons.addon_key IS 'Unique identifier for the add-on (e.g., mileage_tracker)';
COMMENT ON COLUMN business_subscription_addons.stripe_subscription_item_id IS 'Stripe subscription item ID for billing';
COMMENT ON COLUMN business_subscription_addons.status IS 'Status: active, canceled, or past_due';
