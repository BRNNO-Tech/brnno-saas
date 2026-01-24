-- Create priority_time_blocks table
CREATE TABLE IF NOT EXISTS priority_time_blocks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid REFERENCES businesses(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  days text[] NOT NULL, -- Array of day names: ['monday', 'tuesday', etc.]
  start_time time NOT NULL, -- Time in HH:MM format
  end_time time NOT NULL,
  priority_for text NOT NULL, -- What this block is for: 'maintenance', 'vip_customers', etc.
  fallback_hours integer DEFAULT 24, -- Hours before slot opens to everyone
  enabled boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS priority_time_blocks_business_id_idx ON priority_time_blocks(business_id);
CREATE INDEX IF NOT EXISTS priority_time_blocks_enabled_idx ON priority_time_blocks(enabled);
CREATE INDEX IF NOT EXISTS priority_time_blocks_days_idx ON priority_time_blocks USING gin(days);

-- RLS Policies
ALTER TABLE priority_time_blocks ENABLE ROW LEVEL SECURITY;

-- Users can view their own priority blocks
CREATE POLICY "Users can view own priority blocks"
  ON priority_time_blocks
  FOR SELECT
  USING (
    business_id IN (
      SELECT id FROM businesses WHERE owner_id = auth.uid()
    )
  );

-- Users can insert their own priority blocks
CREATE POLICY "Users can insert own priority blocks"
  ON priority_time_blocks
  FOR INSERT
  WITH CHECK (
    business_id IN (
      SELECT id FROM businesses WHERE owner_id = auth.uid()
    )
  );

-- Users can update their own priority blocks
CREATE POLICY "Users can update own priority blocks"
  ON priority_time_blocks
  FOR UPDATE
  USING (
    business_id IN (
      SELECT id FROM businesses WHERE owner_id = auth.uid()
    )
  );

-- Users can delete their own priority blocks
CREATE POLICY "Users can delete own priority blocks"
  ON priority_time_blocks
  FOR DELETE
  USING (
    business_id IN (
      SELECT id FROM businesses WHERE owner_id = auth.uid()
    )
  );

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_priority_time_blocks_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_priority_time_blocks_updated_at
  BEFORE UPDATE ON priority_time_blocks
  FOR EACH ROW
  EXECUTE FUNCTION update_priority_time_blocks_updated_at();
