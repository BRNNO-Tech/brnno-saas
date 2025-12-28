-- Migration: Universal Asset Architecture
-- Run this in Supabase SQL Editor

-- 1. Add industry type to businesses to determine which "Vertical Skin" to show
ALTER TABLE businesses 
ADD COLUMN IF NOT EXISTS industry TEXT DEFAULT 'detailing';

-- 2. Add generic asset_details to jobs to store the "Universal Core" data
-- This JSONB column will store { "make": "Ford", "model": "F-150" } or { "bedrooms": 3, "bathrooms": 2 }
ALTER TABLE jobs 
ADD COLUMN IF NOT EXISTS asset_details JSONB DEFAULT '{}'::jsonb;

-- 3. (Optional) Create a reusable assets table for returning customers (e.g. "My Garage")
CREATE TABLE IF NOT EXISTS client_assets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  name TEXT NOT NULL, -- "My Truck" or "Main House"
  type TEXT NOT NULL, -- "vehicle" or "property"
  details JSONB DEFAULT '{}'::jsonb, -- The specific attributes
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on client_assets
ALTER TABLE client_assets ENABLE ROW LEVEL SECURITY;

-- Policies for client_assets
CREATE POLICY "Users can view their own client assets"
  ON client_assets FOR SELECT
  USING (
    business_id IN (
      SELECT id FROM businesses WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage their own client assets"
  ON client_assets FOR ALL
  USING (
    business_id IN (
      SELECT id FROM businesses WHERE owner_id = auth.uid()
    )
  );

