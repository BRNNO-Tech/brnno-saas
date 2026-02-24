-- Business profile data (idempotent: safe if table already exists)
CREATE TABLE IF NOT EXISTS business_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL UNIQUE REFERENCES businesses(id) ON DELETE CASCADE,

  -- About
  tagline TEXT,
  bio TEXT,

  -- Contact
  phone TEXT,
  email TEXT,
  service_area TEXT,

  -- Branding
  logo_url TEXT,
  banner_url TEXT,

  -- Social Links
  instagram_url TEXT,
  facebook_url TEXT,
  tiktok_url TEXT,
  youtube_url TEXT,
  twitter_url TEXT,

  -- Portfolio
  portfolio_photos JSONB DEFAULT '[]'::jsonb,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_business_profiles_business ON business_profiles(business_id);

ALTER TABLE business_profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if re-run (by name), then create
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON business_profiles;
CREATE POLICY "Public profiles are viewable by everyone"
ON business_profiles FOR SELECT
USING (true);

DROP POLICY IF EXISTS "Business owners can update their profile" ON business_profiles;
CREATE POLICY "Business owners can update their profile"
ON business_profiles FOR ALL
USING (
  business_id IN (
    SELECT id FROM businesses WHERE owner_id = auth.uid()
  )
)
WITH CHECK (
  business_id IN (
    SELECT id FROM businesses WHERE owner_id = auth.uid()
  )
);

-- Auto-update timestamp (idempotent)
CREATE OR REPLACE FUNCTION update_business_profiles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS business_profiles_updated_at ON business_profiles;
CREATE TRIGGER business_profiles_updated_at
  BEFORE UPDATE ON business_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_business_profiles_updated_at();
