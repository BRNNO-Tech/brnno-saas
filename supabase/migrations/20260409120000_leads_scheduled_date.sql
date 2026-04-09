-- Customer-selected appointment datetime from public booking flow
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'leads' AND column_name = 'scheduled_date'
  ) THEN
    ALTER TABLE leads ADD COLUMN scheduled_date TIMESTAMPTZ;
  END IF;
END $$;

COMMENT ON COLUMN leads.scheduled_date IS 'Date/time chosen in booking flow (customer local interpreted as ISO via API)';
