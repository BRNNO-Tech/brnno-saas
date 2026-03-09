-- Add maintenance schedule columns to clients table
-- Run in Supabase SQL Editor. Safe to re-run (IF NOT EXISTS).

ALTER TABLE clients
  ADD COLUMN IF NOT EXISTS maintenance_interval TEXT,
  ADD COLUMN IF NOT EXISTS maintenance_interval_days INTEGER;

COMMENT ON COLUMN clients.maintenance_interval IS 'Preset: weekly, biweekly, monthly, or custom';
COMMENT ON COLUMN clients.maintenance_interval_days IS 'Used when maintenance_interval is custom; otherwise derive from preset (7, 14, 30)';
