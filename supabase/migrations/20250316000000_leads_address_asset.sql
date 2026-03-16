-- Add address and vehicle/asset columns to leads for booking flow (step 7 data)
-- Matches job fields so lead has service address and asset details before booking completes

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'leads' AND column_name = 'address') THEN
    ALTER TABLE leads ADD COLUMN address TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'leads' AND column_name = 'city') THEN
    ALTER TABLE leads ADD COLUMN city TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'leads' AND column_name = 'state') THEN
    ALTER TABLE leads ADD COLUMN state TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'leads' AND column_name = 'zip') THEN
    ALTER TABLE leads ADD COLUMN zip TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'leads' AND column_name = 'asset_details') THEN
    ALTER TABLE leads ADD COLUMN asset_details JSONB;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'leads' AND column_name = 'vehicle_type') THEN
    ALTER TABLE leads ADD COLUMN vehicle_type TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'leads' AND column_name = 'vehicle_color') THEN
    ALTER TABLE leads ADD COLUMN vehicle_color TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'leads' AND column_name = 'vehicle_condition') THEN
    ALTER TABLE leads ADD COLUMN vehicle_condition TEXT;
  END IF;
END $$;

COMMENT ON COLUMN leads.address IS 'Street address from booking flow (step 7)';
COMMENT ON COLUMN leads.asset_details IS 'Vehicle/asset details (year, make, model, size, color) from booking flow';
