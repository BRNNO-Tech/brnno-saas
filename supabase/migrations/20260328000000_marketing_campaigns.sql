-- Marketing: campaigns, recipients, caption history; optional link from discount_codes

-- =============================================================================
-- campaigns
-- =============================================================================
CREATE TABLE IF NOT EXISTS campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  channel TEXT NOT NULL CHECK (channel IN ('email', 'sms')),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'sent', 'failed')),
  subject TEXT,
  body TEXT NOT NULL DEFAULT '',
  audience_filter JSONB NOT NULL DEFAULT '{}'::jsonb,
  recipient_count INTEGER,
  sent_at TIMESTAMPTZ,
  scheduled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS campaigns_business_id_idx ON campaigns(business_id);
CREATE INDEX IF NOT EXISTS campaigns_status_idx ON campaigns(business_id, status);

-- =============================================================================
-- campaign_recipients
-- =============================================================================
CREATE TABLE IF NOT EXISTS campaign_recipients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (
    status IN ('pending', 'sent', 'failed', 'bounced', 'unsubscribed')
  ),
  sent_at TIMESTAMPTZ,
  error TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS campaign_recipients_campaign_id_idx ON campaign_recipients(campaign_id);
CREATE INDEX IF NOT EXISTS campaign_recipients_business_id_idx ON campaign_recipients(business_id);

-- =============================================================================
-- caption_generations (optional history)
-- =============================================================================
CREATE TABLE IF NOT EXISTS caption_generations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  service_type TEXT,
  prompt_used TEXT,
  captions JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS caption_generations_business_id_idx ON caption_generations(business_id);

-- =============================================================================
-- discount_codes: optional link to campaign
-- =============================================================================
ALTER TABLE discount_codes
  ADD COLUMN IF NOT EXISTS campaign_id UUID REFERENCES campaigns(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS discount_codes_campaign_id_idx ON discount_codes(campaign_id)
  WHERE campaign_id IS NOT NULL;

-- =============================================================================
-- RLS: campaigns
-- =============================================================================
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Business owners manage campaigns" ON campaigns;
CREATE POLICY "Business owners manage campaigns"
  ON campaigns
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM businesses
      WHERE businesses.id = campaigns.business_id
        AND businesses.owner_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM businesses
      WHERE businesses.id = campaigns.business_id
        AND businesses.owner_id = auth.uid()
    )
  );

-- =============================================================================
-- RLS: campaign_recipients
-- =============================================================================
ALTER TABLE campaign_recipients ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Business owners manage campaign_recipients" ON campaign_recipients;
CREATE POLICY "Business owners manage campaign_recipients"
  ON campaign_recipients
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM businesses
      WHERE businesses.id = campaign_recipients.business_id
        AND businesses.owner_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM businesses
      WHERE businesses.id = campaign_recipients.business_id
        AND businesses.owner_id = auth.uid()
    )
  );

-- =============================================================================
-- RLS: caption_generations
-- =============================================================================
ALTER TABLE caption_generations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Business owners manage caption_generations" ON caption_generations;
CREATE POLICY "Business owners manage caption_generations"
  ON caption_generations
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM businesses
      WHERE businesses.id = caption_generations.business_id
        AND businesses.owner_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM businesses
      WHERE businesses.id = caption_generations.business_id
        AND businesses.owner_id = auth.uid()
    )
  );

-- =============================================================================
-- updated_at trigger for campaigns
-- =============================================================================
CREATE OR REPLACE FUNCTION set_campaigns_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS campaigns_updated_at ON campaigns;
CREATE TRIGGER campaigns_updated_at
  BEFORE UPDATE ON campaigns
  FOR EACH ROW
  EXECUTE FUNCTION set_campaigns_updated_at();
