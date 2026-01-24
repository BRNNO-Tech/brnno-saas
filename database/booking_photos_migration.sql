-- Booking Photos Migration
-- Creates table to store photos uploaded during the booking process
-- These photos are analyzed by AI to detect vehicle condition and suggest add-ons

CREATE TABLE IF NOT EXISTS booking_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID REFERENCES leads(id) ON DELETE CASCADE NOT NULL,
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE NOT NULL,
  photo_type TEXT NOT NULL CHECK (photo_type IN ('exterior', 'interior', 'problem_area', 'other')),
  storage_path TEXT NOT NULL,
  storage_url TEXT NOT NULL,
  file_size INTEGER,
  mime_type TEXT,
  ai_analysis JSONB,
  ai_processed BOOLEAN DEFAULT false,
  ai_processed_at TIMESTAMPTZ,
  ai_error TEXT,
  uploaded_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE booking_photos ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Allow public to insert photos during booking (before authentication)
CREATE POLICY "Public can insert booking photos"
  ON booking_photos FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Business owners can view photos for their leads
CREATE POLICY "Business owners can view their booking photos"
  ON booking_photos FOR SELECT
  USING (business_id IN (SELECT id FROM businesses WHERE owner_id = auth.uid()));

-- Business owners can update their booking photos
CREATE POLICY "Business owners can update their booking photos"
  ON booking_photos FOR UPDATE
  USING (business_id IN (SELECT id FROM businesses WHERE owner_id = auth.uid()));

-- Business owners can delete their booking photos
CREATE POLICY "Business owners can delete their booking photos"
  ON booking_photos FOR DELETE
  USING (business_id IN (SELECT id FROM businesses WHERE owner_id = auth.uid()));

-- Indexes for performance
CREATE INDEX IF NOT EXISTS booking_photos_lead_id_idx ON booking_photos(lead_id);
CREATE INDEX IF NOT EXISTS booking_photos_business_id_idx ON booking_photos(business_id);
CREATE INDEX IF NOT EXISTS booking_photos_photo_type_idx ON booking_photos(photo_type);
CREATE INDEX IF NOT EXISTS booking_photos_ai_processed_idx ON booking_photos(ai_processed) WHERE ai_processed = false;

-- Add AI analysis columns to leads table if they don't exist
DO $$ 
BEGIN
  -- Add AI vehicle size
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'leads' AND column_name = 'ai_vehicle_size') THEN
    ALTER TABLE leads ADD COLUMN ai_vehicle_size TEXT CHECK (ai_vehicle_size IN ('sedan', 'suv', 'truck', 'van'));
  END IF;

  -- Add AI condition
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'leads' AND column_name = 'ai_condition') THEN
    ALTER TABLE leads ADD COLUMN ai_condition TEXT CHECK (ai_condition IN ('lightly_dirty', 'moderately_dirty', 'heavily_soiled', 'extreme'));
  END IF;

  -- Add AI detected issues (array)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'leads' AND column_name = 'ai_detected_issues') THEN
    ALTER TABLE leads ADD COLUMN ai_detected_issues TEXT[];
  END IF;

  -- Add AI suggested addons (JSONB)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'leads' AND column_name = 'ai_suggested_addons') THEN
    ALTER TABLE leads ADD COLUMN ai_suggested_addons JSONB;
  END IF;

  -- Add AI confidence score
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'leads' AND column_name = 'ai_confidence_score') THEN
    ALTER TABLE leads ADD COLUMN ai_confidence_score NUMERIC(5, 2);
  END IF;

  -- Add AI analysis summary (JSONB)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'leads' AND column_name = 'ai_analysis_summary') THEN
    ALTER TABLE leads ADD COLUMN ai_analysis_summary JSONB;
  END IF;

  -- Add photos uploaded flag
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'leads' AND column_name = 'photos_uploaded') THEN
    ALTER TABLE leads ADD COLUMN photos_uploaded BOOLEAN DEFAULT false;
  END IF;
END $$;

-- Comments for documentation
COMMENT ON TABLE booking_photos IS 'Photos uploaded during booking process for AI analysis';
COMMENT ON COLUMN booking_photos.ai_analysis IS 'JSONB field storing AI analysis results';
COMMENT ON COLUMN booking_photos.photo_type IS 'Type of photo: exterior, interior, problem_area, or other';
