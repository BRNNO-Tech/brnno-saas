-- Mileage Tracking Schema
-- Creates job_mileage table and adds location columns to jobs table

-- Add location columns to jobs table if they don't exist
ALTER TABLE jobs 
  ADD COLUMN IF NOT EXISTS latitude NUMERIC(10, 8),
  ADD COLUMN IF NOT EXISTS longitude NUMERIC(11, 8);

-- Create job_mileage table
CREATE TABLE IF NOT EXISTS job_mileage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE NOT NULL,
  job_id UUID REFERENCES jobs(id) ON DELETE CASCADE NOT NULL,
  previous_job_id UUID REFERENCES jobs(id) ON DELETE SET NULL,
  
  -- Address information
  from_address TEXT,
  from_city TEXT,
  from_state TEXT,
  from_zip TEXT,
  from_latitude NUMERIC(10, 8),
  from_longitude NUMERIC(11, 8),
  
  to_address TEXT,
  to_city TEXT,
  to_state TEXT,
  to_zip TEXT,
  to_latitude NUMERIC(10, 8),
  to_longitude NUMERIC(11, 8),
  
  -- Mileage data
  miles_driven NUMERIC(6, 2) NOT NULL,
  is_manual_override BOOLEAN DEFAULT false,
  notes TEXT,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE job_mileage ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Business owners can view their mileage records"
  ON job_mileage FOR SELECT
  USING (business_id IN (SELECT id FROM businesses WHERE owner_id = auth.uid()));

CREATE POLICY "Business owners can insert mileage records"
  ON job_mileage FOR INSERT
  WITH CHECK (business_id IN (SELECT id FROM businesses WHERE owner_id = auth.uid()));

CREATE POLICY "Business owners can update their mileage records"
  ON job_mileage FOR UPDATE
  USING (business_id IN (SELECT id FROM businesses WHERE owner_id = auth.uid()));

CREATE POLICY "Business owners can delete their mileage records"
  ON job_mileage FOR DELETE
  USING (business_id IN (SELECT id FROM businesses WHERE owner_id = auth.uid()));

-- Indexes for performance
CREATE INDEX IF NOT EXISTS job_mileage_business_id_idx ON job_mileage(business_id);
CREATE INDEX IF NOT EXISTS job_mileage_job_id_idx ON job_mileage(job_id);
CREATE INDEX IF NOT EXISTS job_mileage_previous_job_id_idx ON job_mileage(previous_job_id);
CREATE INDEX IF NOT EXISTS job_mileage_created_at_idx ON job_mileage(created_at DESC);

-- Add completed_at column to jobs if it doesn't exist (for tracking completion time)
ALTER TABLE jobs 
  ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;

-- Create index on completed_at for efficient queries
CREATE INDEX IF NOT EXISTS jobs_completed_at_idx ON jobs(completed_at DESC) WHERE completed_at IS NOT NULL;

-- Comments for documentation
COMMENT ON TABLE job_mileage IS 'Tracks mileage between jobs for tax deduction purposes';
COMMENT ON COLUMN job_mileage.miles_driven IS 'Distance in miles between from and to locations';
COMMENT ON COLUMN job_mileage.is_manual_override IS 'True if user manually entered/edited the mileage';
COMMENT ON COLUMN job_mileage.previous_job_id IS 'The job that was completed before this one (for auto-tracking)';
