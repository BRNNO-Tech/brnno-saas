-- Migration: Add duration_minutes to service_addons table
-- This allows businesses to specify how much additional time each add-on adds to the service duration

ALTER TABLE service_addons
ADD COLUMN IF NOT EXISTS duration_minutes INTEGER DEFAULT 0;

COMMENT ON COLUMN service_addons.duration_minutes IS 'Additional time in minutes this add-on adds to the service duration. Used for scheduling conflict detection and accurate time estimates.';
