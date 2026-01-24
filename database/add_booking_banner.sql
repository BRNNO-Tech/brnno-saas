-- Add booking banner URL column to businesses table
-- This allows detailers to add a custom header image to their booking pages

ALTER TABLE businesses 
ADD COLUMN IF NOT EXISTS booking_banner_url TEXT;

-- Add comment
COMMENT ON COLUMN businesses.booking_banner_url IS 'URL of the custom banner image displayed at the top of booking pages';
