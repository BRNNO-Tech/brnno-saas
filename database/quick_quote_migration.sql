-- Migration: Add Quick Quote columns to quotes table
-- Run this in your Supabase SQL Editor

-- Add columns for quick quotes if they don't exist
ALTER TABLE quotes 
ADD COLUMN IF NOT EXISTS vehicle_type TEXT,
ADD COLUMN IF NOT EXISTS vehicle_condition TEXT,
ADD COLUMN IF NOT EXISTS services JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS total_price NUMERIC(10, 2),
ADD COLUMN IF NOT EXISTS quote_code TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS customer_name TEXT,
ADD COLUMN IF NOT EXISTS customer_phone TEXT,
ADD COLUMN IF NOT EXISTS customer_email TEXT,
ADD COLUMN IF NOT EXISTS viewed_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS booked BOOLEAN DEFAULT FALSE;

-- Create index on quote_code for faster lookups
CREATE INDEX IF NOT EXISTS idx_quotes_quote_code ON quotes(quote_code);

-- Create function to generate unique quote codes
CREATE OR REPLACE FUNCTION generate_quote_code()
RETURNS TEXT AS $$
DECLARE
  code TEXT;
  exists BOOLEAN;
BEGIN
  LOOP
    -- Generate a 6-character alphanumeric code
    code := UPPER(SUBSTRING(MD5(RANDOM()::TEXT || CLOCK_TIMESTAMP()::TEXT) FROM 1 FOR 6));
    
    -- Check if code already exists
    SELECT EXISTS(SELECT 1 FROM quotes WHERE quote_code = code) INTO exists;
    
    -- If code doesn't exist, return it
    IF NOT exists THEN
      RETURN code;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Add comment for documentation
COMMENT ON COLUMN quotes.vehicle_type IS 'Vehicle type: sedan, suv, or truck';
COMMENT ON COLUMN quotes.vehicle_condition IS 'Vehicle condition: normal, dirty, or very_dirty';
COMMENT ON COLUMN quotes.services IS 'Array of service IDs as JSONB';
COMMENT ON COLUMN quotes.total_price IS 'Total price for the quote';
COMMENT ON COLUMN quotes.quote_code IS 'Unique code for public quote viewing';
COMMENT ON COLUMN quotes.viewed_at IS 'Timestamp when quote was first viewed by customer';
COMMENT ON COLUMN quotes.booked IS 'Whether this quote has been converted to a booking';
