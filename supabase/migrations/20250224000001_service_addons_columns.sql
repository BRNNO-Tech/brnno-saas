-- Ensure service_addons has service_id and duration_minutes (for add-ons management and booking)
-- Run this if add-ons "Add from Popular" or "Create Add-on" fail with a column error

ALTER TABLE service_addons
  ADD COLUMN IF NOT EXISTS service_id UUID REFERENCES services(id) ON DELETE SET NULL;

ALTER TABLE service_addons
  ADD COLUMN IF NOT EXISTS duration_minutes INTEGER DEFAULT 0;

ALTER TABLE service_addons
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

CREATE INDEX IF NOT EXISTS idx_service_addons_service_id ON service_addons(service_id);

COMMENT ON COLUMN service_addons.service_id IS 'NULL = business-wide add-on; set = only for this service';
COMMENT ON COLUMN service_addons.duration_minutes IS 'Additional minutes this add-on adds to the service';
