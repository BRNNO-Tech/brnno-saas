-- Base service_addons table (columns service_id, duration_minutes, updated_at in 20250224000001)

CREATE TABLE IF NOT EXISTS service_addons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC(10, 2) NOT NULL,
  icon TEXT DEFAULT '⭐',
  is_active BOOLEAN DEFAULT TRUE,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS service_addons_business_id_idx ON service_addons(business_id);

ALTER TABLE service_addons ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view active addons" ON service_addons;
CREATE POLICY "Public can view active addons"
  ON service_addons FOR SELECT
  USING (is_active = true);

DROP POLICY IF EXISTS "Business owners can manage addons" ON service_addons;
CREATE POLICY "Business owners can manage addons"
  ON service_addons FOR ALL
  USING (business_id IN (SELECT id FROM businesses WHERE owner_id = auth.uid()))
  WITH CHECK (business_id IN (SELECT id FROM businesses WHERE owner_id = auth.uid()));
