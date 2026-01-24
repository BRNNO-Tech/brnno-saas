-- Add SMS consent column to leads table
-- Run this in your Supabase SQL Editor

-- Add SMS consent column
ALTER TABLE leads 
ADD COLUMN IF NOT EXISTS sms_consent BOOLEAN DEFAULT false;

-- Add index for filtering consented leads (useful for SMS campaigns)
CREATE INDEX IF NOT EXISTS idx_leads_sms_consent ON leads(sms_consent) WHERE sms_consent = true;

-- Add comment for documentation
COMMENT ON COLUMN leads.sms_consent IS 'User consent to receive automated SMS messages. Required for TCPA compliance.';

-- Verification
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'leads' 
AND column_name = 'sms_consent';

SELECT 'SMS consent column added successfully!' as status;
