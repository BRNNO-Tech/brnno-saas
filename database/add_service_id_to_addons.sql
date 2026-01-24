-- Add service_id column to service_addons table if it doesn't exist
-- This migration updates the table structure to support service-specific add-ons

-- Add service_id column
ALTER TABLE service_addons 
  ADD COLUMN IF NOT EXISTS service_id UUID REFERENCES services(id) ON DELETE CASCADE;

-- Add updated_at column if it doesn't exist
ALTER TABLE service_addons 
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Create index on service_id for better query performance
CREATE INDEX IF NOT EXISTS idx_service_addons_service_id ON service_addons(service_id);

-- Update existing add-ons to have a service_id (optional - only if you want to migrate existing data)
-- This would need to be customized based on your business logic
-- For now, we'll leave it as NULL for existing add-ons and new ones will require service_id
