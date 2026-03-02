-- Add add-ons column to quotes (for Quick Quote – same as booking flow)
-- Run in Supabase SQL Editor if you haven't run the supabase migration.
ALTER TABLE quotes
ADD COLUMN IF NOT EXISTS addons JSONB DEFAULT '[]'::jsonb;

COMMENT ON COLUMN quotes.addons IS 'Selected add-ons for the quote: array of { id, name, price?, duration_minutes? }';
