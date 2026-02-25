-- Add service_id and duration_minutes to service_addons (for Add-ons management)
-- Run in Supabase SQL Editor if "Add from Popular" or "Create Add-on" fails

ALTER TABLE service_addons
  ADD COLUMN IF NOT EXISTS service_id UUID REFERENCES services(id) ON DELETE SET NULL;

ALTER TABLE service_addons
  ADD COLUMN IF NOT EXISTS duration_minutes INTEGER DEFAULT 0;

ALTER TABLE service_addons
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

CREATE INDEX IF NOT EXISTS idx_service_addons_service_id ON service_addons(service_id);
