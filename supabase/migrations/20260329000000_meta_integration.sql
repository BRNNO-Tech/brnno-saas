-- Meta Lead Ads: integrations + lead queue; optional client source for CRM attribution

ALTER TABLE clients
  ADD COLUMN IF NOT EXISTS source TEXT;

-- =============================================================================
-- integrations
-- =============================================================================
CREATE TABLE IF NOT EXISTS integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  provider TEXT NOT NULL DEFAULT 'meta',
  page_id TEXT,
  page_name TEXT,
  page_access_token TEXT,
  ad_account_id TEXT,
  connected_at TIMESTAMPTZ,
  token_expires_at TIMESTAMPTZ,
  is_active BOOLEAN NOT NULL DEFAULT true,
  automations JSONB NOT NULL DEFAULT '{
    "createCrmRecord": true,
    "fireSmsAgent": true,
    "sendWelcomeEmail": true,
    "addToNurtureCampaign": false,
    "nurtureCampaignId": null
  }'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT integrations_business_provider_unique UNIQUE (business_id, provider)
);

CREATE INDEX IF NOT EXISTS integrations_business_id_idx ON integrations(business_id);
CREATE INDEX IF NOT EXISTS integrations_page_id_idx ON integrations(page_id);

-- =============================================================================
-- integration_leads
-- =============================================================================
CREATE TABLE IF NOT EXISTS integration_leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  integration_id UUID NOT NULL REFERENCES integrations(id) ON DELETE CASCADE,
  meta_lead_id TEXT UNIQUE,
  ad_id TEXT,
  ad_name TEXT,
  form_id TEXT,
  raw_data JSONB,
  client_id UUID REFERENCES clients(id),
  processed_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processed', 'failed')),
  error TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS integration_leads_business_id_idx ON integration_leads(business_id);
CREATE INDEX IF NOT EXISTS integration_leads_meta_lead_id_idx ON integration_leads(meta_lead_id);

-- =============================================================================
-- RLS
-- =============================================================================
ALTER TABLE integrations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "tenant_isolation" ON integrations;
CREATE POLICY "tenant_isolation"
  ON integrations
  FOR ALL
  USING (
    business_id = (SELECT id FROM businesses WHERE owner_id = auth.uid())
  )
  WITH CHECK (
    business_id = (SELECT id FROM businesses WHERE owner_id = auth.uid())
  );

ALTER TABLE integration_leads ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "tenant_isolation" ON integration_leads;
CREATE POLICY "tenant_isolation"
  ON integration_leads
  FOR ALL
  USING (
    business_id = (SELECT id FROM businesses WHERE owner_id = auth.uid())
  )
  WITH CHECK (
    business_id = (SELECT id FROM businesses WHERE owner_id = auth.uid())
  );

-- =============================================================================
-- updated_at trigger for integrations
-- =============================================================================
CREATE OR REPLACE FUNCTION set_integrations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS integrations_updated_at ON integrations;
CREATE TRIGGER integrations_updated_at
  BEFORE UPDATE ON integrations
  FOR EACH ROW
  EXECUTE FUNCTION set_integrations_updated_at();
