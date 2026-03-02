-- Add add-ons column to quotes (same as booking flow)
ALTER TABLE quotes
ADD COLUMN IF NOT EXISTS addons JSONB DEFAULT '[]'::jsonb;

COMMENT ON COLUMN quotes.addons IS 'Selected add-ons for the quote: array of { id, name, price?, duration_minutes? }';
