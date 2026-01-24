-- Auto-Assignment System Setup
-- Run this in your Supabase SQL Editor

-- ============================================
-- 1. Add auto-assignment settings to businesses
-- ============================================
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS
  auto_assignment_enabled BOOLEAN DEFAULT false,
  auto_assignment_method TEXT DEFAULT 'manual' CHECK (auto_assignment_method IN ('manual', 'rule_based', 'ai')),
  auto_assignment_rules JSONB DEFAULT '{}'::jsonb;

-- ============================================
-- 2. Track assignment method in job_assignments
-- ============================================
ALTER TABLE job_assignments ADD COLUMN IF NOT EXISTS
  assignment_method TEXT DEFAULT 'manual' CHECK (assignment_method IN ('manual', 'rule_based', 'ai')),
  assignment_confidence DECIMAL(3,2); -- For AI assignments (0.00 to 1.00)

-- ============================================
-- 3. Add worker capacity settings
-- ============================================
ALTER TABLE team_members ADD COLUMN IF NOT EXISTS
  max_jobs_per_day INTEGER DEFAULT 5,
  preferred_service_types TEXT[],
  availability_schedule JSONB; -- Custom availability patterns

-- ============================================
-- 4. Create assignment rules table (for Fleet tier)
-- ============================================
CREATE TABLE IF NOT EXISTS assignment_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE NOT NULL,
  rule_type TEXT NOT NULL CHECK (rule_type IN ('skills_match', 'round_robin', 'load_balance', 'proximity', 'priority', 'custom')),
  priority INTEGER DEFAULT 0, -- Higher priority rules run first
  enabled BOOLEAN DEFAULT true,
  config JSONB DEFAULT '{}'::jsonb, -- Rule-specific configuration
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_assignment_rules_business ON assignment_rules(business_id);
CREATE INDEX IF NOT EXISTS idx_assignment_rules_enabled ON assignment_rules(business_id, enabled, priority);

-- ============================================
-- 5. Create AI add-ons tracking table
-- ============================================
CREATE TABLE IF NOT EXISTS business_ai_addons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE NOT NULL,
  addon_id TEXT NOT NULL, -- 'job-assignment', 'chatbot', 'lead-recovery', etc.
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'cancelled')),
  subscribed_at TIMESTAMPTZ DEFAULT NOW(),
  cancelled_at TIMESTAMPTZ,
  UNIQUE(business_id, addon_id)
);

CREATE INDEX IF NOT EXISTS idx_business_ai_addons_business ON business_ai_addons(business_id);
CREATE INDEX IF NOT EXISTS idx_business_ai_addons_status ON business_ai_addons(business_id, status);

-- ============================================
-- 6. RLS Policies for new tables
-- ============================================

-- Assignment Rules
ALTER TABLE assignment_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Business owners can manage assignment rules"
  ON assignment_rules FOR ALL
  TO authenticated
  USING (
    business_id IN (
      SELECT id FROM businesses WHERE owner_id = auth.uid()
    )
  );

-- AI Add-ons
ALTER TABLE business_ai_addons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Business owners can view their AI add-ons"
  ON business_ai_addons FOR SELECT
  TO authenticated
  USING (
    business_id IN (
      SELECT id FROM businesses WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "Business owners can manage their AI add-ons"
  ON business_ai_addons FOR INSERT
  TO authenticated
  WITH CHECK (
    business_id IN (
      SELECT id FROM businesses WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "Business owners can update their AI add-ons"
  ON business_ai_addons FOR UPDATE
  TO authenticated
  USING (
    business_id IN (
      SELECT id FROM businesses WHERE owner_id = auth.uid()
    )
  );

-- ============================================
-- 7. Helper function to check if business has AI add-on
-- ============================================
CREATE OR REPLACE FUNCTION business_has_ai_addon(
  business_id_param UUID,
  addon_id_param TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM business_ai_addons
    WHERE business_id = business_id_param
    AND addon_id = addon_id_param
    AND status = 'active'
  );
END;
$$;

GRANT EXECUTE ON FUNCTION business_has_ai_addon(UUID, TEXT) TO authenticated;

-- ============================================
-- 8. Verification
-- ============================================
SELECT 'Auto-assignment system setup complete!' as status;

-- Check columns were added
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'businesses' 
AND column_name LIKE '%auto_assignment%'
ORDER BY column_name;

SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'job_assignments' 
AND column_name LIKE '%assignment%'
ORDER BY column_name;

SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'team_members' 
AND column_name IN ('max_jobs_per_day', 'preferred_service_types', 'availability_schedule')
ORDER BY column_name;
