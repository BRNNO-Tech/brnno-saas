-- Quick Quote: base table (addons added in 20250224000000_quotes_add_addons.sql)

CREATE TABLE IF NOT EXISTS quotes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,
  vehicle_type TEXT,
  vehicle_condition TEXT,
  services JSONB DEFAULT '[]'::jsonb,
  total_price NUMERIC(10, 2),
  quote_code TEXT NOT NULL UNIQUE,
  customer_name TEXT,
  customer_phone TEXT,
  customer_email TEXT,
  viewed_at TIMESTAMPTZ,
  booked BOOLEAN DEFAULT FALSE,
  status TEXT NOT NULL DEFAULT 'draft',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_quotes_business_id ON quotes(business_id);
CREATE INDEX IF NOT EXISTS idx_quotes_quote_code ON quotes(quote_code);
CREATE INDEX IF NOT EXISTS idx_quotes_created_at ON quotes(created_at DESC);

ALTER TABLE quotes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Business owners can manage quotes" ON quotes;
CREATE POLICY "Business owners can manage quotes"
  ON quotes FOR ALL
  USING (business_id IN (SELECT id FROM businesses WHERE owner_id = auth.uid()))
  WITH CHECK (business_id IN (SELECT id FROM businesses WHERE owner_id = auth.uid()));

CREATE OR REPLACE FUNCTION generate_quote_code()
RETURNS TEXT AS $$
DECLARE
  code TEXT;
  code_exists BOOLEAN;
BEGIN
  LOOP
    code := UPPER(SUBSTRING(MD5(RANDOM()::TEXT || CLOCK_TIMESTAMP()::TEXT) FROM 1 FOR 6));
    SELECT EXISTS(SELECT 1 FROM quotes WHERE quote_code = code) INTO code_exists;
    IF NOT code_exists THEN
      RETURN code;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

REVOKE ALL ON FUNCTION generate_quote_code() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION generate_quote_code() TO authenticated;
GRANT EXECUTE ON FUNCTION generate_quote_code() TO service_role;

COMMENT ON COLUMN quotes.vehicle_type IS 'Vehicle type: sedan, suv, truck, van, coupe, crossover';
COMMENT ON COLUMN quotes.vehicle_condition IS 'Condition tier id from business condition_config';
COMMENT ON COLUMN quotes.services IS 'Array of service UUIDs as JSONB';
COMMENT ON COLUMN quotes.total_price IS 'Total price for the quote';
COMMENT ON COLUMN quotes.quote_code IS 'Unique code for public quote viewing';
COMMENT ON COLUMN quotes.viewed_at IS 'Timestamp when quote was first viewed by customer';
COMMENT ON COLUMN quotes.booked IS 'Whether this quote has been converted to a booking';
