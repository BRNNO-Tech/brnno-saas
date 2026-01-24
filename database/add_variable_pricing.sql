-- Migration: Add Variable Pricing & Duration Support
-- This allows services to have different prices and durations based on vehicle size

-- Add pricing_model column (defaults to 'flat' for backward compatibility)
ALTER TABLE services
  ADD COLUMN IF NOT EXISTS pricing_model TEXT DEFAULT 'flat' CHECK (pricing_model IN ('flat', 'variable'));

-- Add variations JSONB column for vehicle-specific pricing
ALTER TABLE services
  ADD COLUMN IF NOT EXISTS variations JSONB DEFAULT '{}'::jsonb;

-- Add base_duration column (in minutes) for fallback/starting point
ALTER TABLE services
  ADD COLUMN IF NOT EXISTS base_duration INTEGER;

-- Update existing services: set base_duration from estimated_duration if not set
UPDATE services
SET base_duration = estimated_duration
WHERE base_duration IS NULL AND estimated_duration IS NOT NULL;

-- Set default base_duration for services that don't have one
UPDATE services
SET base_duration = 120
WHERE base_duration IS NULL;

-- Create index on pricing_model for faster queries
CREATE INDEX IF NOT EXISTS services_pricing_model_idx ON services(pricing_model);

-- Add comment for documentation
COMMENT ON COLUMN services.pricing_model IS 'Pricing model: "flat" for single price, "variable" for vehicle-size-based pricing';
COMMENT ON COLUMN services.variations IS 'JSONB object with vehicle size variations: { "sedan": { "price": 150, "duration": 120, "enabled": true }, ... }';
COMMENT ON COLUMN services.base_duration IS 'Base duration in minutes (used as fallback or starting point for variable pricing)';
