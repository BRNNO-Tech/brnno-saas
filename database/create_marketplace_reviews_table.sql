-- Migration: Create marketplace_reviews table
-- Run this in your Supabase SQL Editor
-- This migration is idempotent - safe to run multiple times

-- Create table if it doesn't exist
CREATE TABLE IF NOT EXISTS marketplace_reviews (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  booking_id UUID REFERENCES jobs(id) ON DELETE SET NULL,
  customer_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  
  -- Review content
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review_text TEXT,
  review_photos TEXT[], -- Array of photo URLs
  
  -- Customer info (denormalized for performance)
  customer_name TEXT NOT NULL,
  customer_photo TEXT, -- Profile photo URL
  
  -- Service info (denormalized)
  service_name TEXT,
  scheduled_date TIMESTAMPTZ,
  
  -- Metadata
  status TEXT DEFAULT 'published' CHECK (status IN ('pending', 'published', 'hidden')),
  is_featured BOOLEAN DEFAULT false,
  helpful_count INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add missing columns if table already exists (skip id as it's the primary key)
ALTER TABLE marketplace_reviews
  ADD COLUMN IF NOT EXISTS business_id UUID,
  ADD COLUMN IF NOT EXISTS booking_id UUID,
  ADD COLUMN IF NOT EXISTS customer_id UUID,
  ADD COLUMN IF NOT EXISTS rating INTEGER,
  ADD COLUMN IF NOT EXISTS review_text TEXT,
  ADD COLUMN IF NOT EXISTS review_photos TEXT[],
  ADD COLUMN IF NOT EXISTS customer_name TEXT,
  ADD COLUMN IF NOT EXISTS customer_photo TEXT,
  ADD COLUMN IF NOT EXISTS service_name TEXT,
  ADD COLUMN IF NOT EXISTS scheduled_date TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'published',
  ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS helpful_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Update existing rows to have default status if status is NULL
UPDATE marketplace_reviews 
SET status = 'published' 
WHERE status IS NULL;

-- Add constraints if they don't exist
DO $$ 
BEGIN
  -- Add foreign key constraints if they don't exist
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'marketplace_reviews_business_id_fkey'
  ) THEN
    ALTER TABLE marketplace_reviews 
      ADD CONSTRAINT marketplace_reviews_business_id_fkey 
      FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'marketplace_reviews_booking_id_fkey'
  ) THEN
    ALTER TABLE marketplace_reviews 
      ADD CONSTRAINT marketplace_reviews_booking_id_fkey 
      FOREIGN KEY (booking_id) REFERENCES jobs(id) ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'marketplace_reviews_customer_id_fkey'
  ) THEN
    ALTER TABLE marketplace_reviews 
      ADD CONSTRAINT marketplace_reviews_customer_id_fkey 
      FOREIGN KEY (customer_id) REFERENCES clients(id) ON DELETE SET NULL;
  END IF;

  -- Add check constraint for rating if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'marketplace_reviews_rating_check'
  ) THEN
    ALTER TABLE marketplace_reviews 
      ADD CONSTRAINT marketplace_reviews_rating_check 
      CHECK (rating >= 1 AND rating <= 5);
  END IF;

  -- Add check constraint for status if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'marketplace_reviews_status_check'
  ) THEN
    ALTER TABLE marketplace_reviews 
      ADD CONSTRAINT marketplace_reviews_status_check 
      CHECK (status IN ('pending', 'published', 'hidden'));
  END IF;
END $$;

-- Set defaults for existing columns
ALTER TABLE marketplace_reviews 
  ALTER COLUMN status SET DEFAULT 'published',
  ALTER COLUMN is_featured SET DEFAULT false,
  ALTER COLUMN helpful_count SET DEFAULT 0,
  ALTER COLUMN updated_at SET DEFAULT NOW();

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_marketplace_reviews_business_id ON marketplace_reviews(business_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_reviews_rating ON marketplace_reviews(rating);
CREATE INDEX IF NOT EXISTS idx_marketplace_reviews_status ON marketplace_reviews(status);
CREATE INDEX IF NOT EXISTS idx_marketplace_reviews_created_at ON marketplace_reviews(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_marketplace_reviews_is_featured ON marketplace_reviews(is_featured) WHERE is_featured = true;

-- Enable RLS
ALTER TABLE marketplace_reviews ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Business owners can view their reviews" ON marketplace_reviews;
DROP POLICY IF EXISTS "Business owners can manage their reviews" ON marketplace_reviews;
DROP POLICY IF EXISTS "Public can view published reviews" ON marketplace_reviews;

-- Policy: Business owners can view all their reviews
CREATE POLICY "Business owners can view their reviews"
  ON marketplace_reviews FOR SELECT
  USING (
    business_id IN (
      SELECT id FROM businesses WHERE owner_id = auth.uid()
    )
  );

-- Policy: Business owners can manage their reviews
CREATE POLICY "Business owners can manage their reviews"
  ON marketplace_reviews FOR ALL
  USING (
    business_id IN (
      SELECT id FROM businesses WHERE owner_id = auth.uid()
    )
  );

-- Policy: Public can view published reviews (for public booking pages)
CREATE POLICY "Public can view published reviews"
  ON marketplace_reviews FOR SELECT
  USING (status = 'published');

-- Add comments
COMMENT ON TABLE marketplace_reviews IS 'Stores customer reviews for marketplace businesses';
COMMENT ON COLUMN marketplace_reviews.rating IS 'Rating from 1 to 5 stars';
COMMENT ON COLUMN marketplace_reviews.review_photos IS 'Array of photo URLs attached to the review';
COMMENT ON COLUMN marketplace_reviews.status IS 'Review status: pending (moderation), published (visible), hidden (removed)';
