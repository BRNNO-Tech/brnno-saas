-- Add brand settings columns to businesses table
-- Run this in your Supabase SQL Editor

ALTER TABLE businesses 
ADD COLUMN IF NOT EXISTS logo_url TEXT,
ADD COLUMN IF NOT EXISTS accent_color TEXT,
ADD COLUMN IF NOT EXISTS sender_name TEXT,
ADD COLUMN IF NOT EXISTS default_tone TEXT;

-- Add comments for documentation
COMMENT ON COLUMN businesses.logo_url IS 'URL of the business logo image';
COMMENT ON COLUMN businesses.accent_color IS 'Brand accent color (hex format, e.g., #6366f1)';
COMMENT ON COLUMN businesses.sender_name IS 'Name used for outbound SMS/Email communications';
COMMENT ON COLUMN businesses.default_tone IS 'Default tone for automated messages: friendly, premium, or direct';
