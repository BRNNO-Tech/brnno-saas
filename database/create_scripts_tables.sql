-- Migration: Scripts Library System for Lead Recovery
-- Run this in your Supabase SQL Editor

-- ============================================
-- 1. Scripts Table
-- ============================================
CREATE TABLE IF NOT EXISTS scripts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN (
    'new_lead_instant_reply',
    'quote_follow_up',
    'missed_call_text_back',
    'shopping_around',
    'incentive_offer',
    'break_up_message',
    'reactivation',
    'custom'
  )),
  channel TEXT NOT NULL CHECK (channel IN ('sms', 'email')),
  body TEXT NOT NULL,
  subject TEXT, -- For email scripts
  tone TEXT NOT NULL CHECK (tone IN ('friendly', 'premium', 'direct')),
  cta_style TEXT NOT NULL CHECK (cta_style IN ('booking_link', 'question', 'both', 'none')),
  is_ab_test BOOLEAN DEFAULT false,
  ab_variant TEXT CHECK (ab_variant IN ('A', 'B')),
  parent_script_id UUID REFERENCES scripts(id) ON DELETE SET NULL, -- For A/B test variants
  is_active BOOLEAN DEFAULT true,
  usage_count INTEGER DEFAULT 0,
  reply_count INTEGER DEFAULT 0,
  booking_count INTEGER DEFAULT 0,
  total_revenue DECIMAL(10, 2) DEFAULT 0,
  avg_time_to_book INTEGER, -- In minutes
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 2. Script Usage Tracking Table
-- ============================================
CREATE TABLE IF NOT EXISTS script_usages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  script_id UUID NOT NULL REFERENCES scripts(id) ON DELETE CASCADE,
  lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,
  interaction_id UUID REFERENCES lead_interactions(id) ON DELETE SET NULL,
  used_at TIMESTAMPTZ DEFAULT NOW(),
  replied_at TIMESTAMPTZ,
  booked_at TIMESTAMPTZ,
  revenue DECIMAL(10, 2),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 3. Indexes
-- ============================================
CREATE INDEX IF NOT EXISTS idx_scripts_business ON scripts(business_id);
CREATE INDEX IF NOT EXISTS idx_scripts_category ON scripts(business_id, category);
CREATE INDEX IF NOT EXISTS idx_scripts_active ON scripts(business_id, is_active);
CREATE INDEX IF NOT EXISTS idx_scripts_ab_test ON scripts(business_id, is_ab_test, parent_script_id);
CREATE INDEX IF NOT EXISTS idx_script_usages_script ON script_usages(script_id);
CREATE INDEX IF NOT EXISTS idx_script_usages_lead ON script_usages(lead_id);
CREATE INDEX IF NOT EXISTS idx_script_usages_used_at ON script_usages(used_at);

-- ============================================
-- 4. Enable RLS
-- ============================================
ALTER TABLE scripts ENABLE ROW LEVEL SECURITY;
ALTER TABLE script_usages ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 5. RLS Policies for scripts
-- ============================================
CREATE POLICY "Users can view their own business scripts"
  ON scripts FOR SELECT
  USING (
    business_id IN (
      SELECT id FROM businesses WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert scripts for their own business"
  ON scripts FOR INSERT
  WITH CHECK (
    business_id IN (
      SELECT id FROM businesses WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own business scripts"
  ON scripts FOR UPDATE
  USING (
    business_id IN (
      SELECT id FROM businesses WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their own business scripts"
  ON scripts FOR DELETE
  USING (
    business_id IN (
      SELECT id FROM businesses WHERE owner_id = auth.uid()
    )
  );

-- ============================================
-- 6. RLS Policies for script_usages
-- ============================================
CREATE POLICY "Users can view script usages for their business"
  ON script_usages FOR SELECT
  USING (
    script_id IN (
      SELECT id FROM scripts WHERE business_id IN (
        SELECT id FROM businesses WHERE owner_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can insert script usages for their business"
  ON script_usages FOR INSERT
  WITH CHECK (
    script_id IN (
      SELECT id FROM scripts WHERE business_id IN (
        SELECT id FROM businesses WHERE owner_id = auth.uid()
      )
    )
  );

-- ============================================
-- 7. Add updated_at trigger
-- ============================================
CREATE TRIGGER update_scripts_updated_at
  BEFORE UPDATE ON scripts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 8. Function to update script performance metrics
-- ============================================
CREATE OR REPLACE FUNCTION update_script_metrics()
RETURNS TRIGGER AS $$
BEGIN
  -- Update script performance metrics when usage is tracked
  UPDATE scripts
  SET
    usage_count = (
      SELECT COUNT(*) FROM script_usages WHERE script_id = NEW.script_id
    ),
    reply_count = (
      SELECT COUNT(*) FROM script_usages 
      WHERE script_id = NEW.script_id AND replied_at IS NOT NULL
    ),
    booking_count = (
      SELECT COUNT(*) FROM script_usages 
      WHERE script_id = NEW.script_id AND booked_at IS NOT NULL
    ),
    total_revenue = (
      SELECT COALESCE(SUM(revenue), 0) FROM script_usages 
      WHERE script_id = NEW.script_id
    ),
    avg_time_to_book = (
      SELECT AVG(EXTRACT(EPOCH FROM (booked_at - used_at)) / 60)::INTEGER
      FROM script_usages
      WHERE script_id = NEW.script_id AND booked_at IS NOT NULL
    )
  WHERE id = NEW.script_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_script_metrics_on_usage
  AFTER INSERT OR UPDATE ON script_usages
  FOR EACH ROW
  EXECUTE FUNCTION update_script_metrics();
