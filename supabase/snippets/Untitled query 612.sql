-- Add Twilio subaccount columns to businesses table
ALTER TABLE businesses 
ADD COLUMN IF NOT EXISTS twilio_subaccount_sid TEXT,
ADD COLUMN IF NOT EXISTS twilio_auth_token TEXT,
ADD COLUMN IF NOT EXISTS twilio_phone_number TEXT,
ADD COLUMN IF NOT EXISTS twilio_messaging_service_sid TEXT,
ADD COLUMN IF NOT EXISTS twilio_setup_complete BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS twilio_setup_status TEXT CHECK (twilio_setup_status IN ('pending', 'verifying', 'active', 'failed')),
ADD COLUMN IF NOT EXISTS a2p_brand_sid TEXT,
ADD COLUMN IF NOT EXISTS a2p_campaign_sid TEXT,
ADD COLUMN IF NOT EXISTS business_ein TEXT,
ADD COLUMN IF NOT EXISTS business_ssn TEXT,
ADD COLUMN IF NOT EXISTS business_legal_name TEXT,
ADD COLUMN IF NOT EXISTS business_verified BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS sms_credits_remaining INTEGER DEFAULT 500,
ADD COLUMN IF NOT EXISTS sms_credits_reset_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS sms_credits_monthly_limit INTEGER DEFAULT 500;

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_businesses_twilio_subaccount ON businesses(twilio_subaccount_sid) WHERE twilio_subaccount_sid IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_businesses_twilio_phone ON businesses(twilio_phone_number) WHERE twilio_phone_number IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_businesses_twilio_setup ON businesses(twilio_setup_complete) WHERE twilio_setup_complete = true;

-- Add comments for documentation
COMMENT ON COLUMN businesses.twilio_subaccount_sid IS 'Twilio subaccount SID for isolated SMS sending';
COMMENT ON COLUMN businesses.twilio_auth_token IS 'Auth token for the business Twilio account (manual or subaccount)';
COMMENT ON COLUMN businesses.twilio_phone_number IS 'Business-owned Twilio phone number in E.164 format';
COMMENT ON COLUMN businesses.twilio_messaging_service_sid IS 'Twilio Messaging Service SID for A2P compliance';
COMMENT ON COLUMN businesses.twilio_setup_complete IS 'Whether Twilio subaccount setup is complete';
COMMENT ON COLUMN businesses.twilio_setup_status IS 'Status of Twilio setup: pending, verifying, active, failed';
COMMENT ON COLUMN businesses.a2p_brand_sid IS 'Twilio A2P Brand Registration SID';
COMMENT ON COLUMN businesses.a2p_campaign_sid IS 'Twilio A2P Campaign SID';
COMMENT ON COLUMN businesses.business_ein IS 'Business EIN (encrypted, for A2P registration)';
COMMENT ON COLUMN businesses.business_ssn IS 'Business SSN (encrypted, for sole proprietors, for A2P registration)';
COMMENT ON COLUMN businesses.business_legal_name IS 'Legal business name for A2P registration';
COMMENT ON COLUMN businesses.business_verified IS 'Whether business info has been verified for A2P';
COMMENT ON COLUMN businesses.sms_credits_remaining IS 'Remaining SMS credits for the current period';
COMMENT ON COLUMN businesses.sms_credits_reset_at IS 'When SMS credits will reset (monthly)';
COMMENT ON COLUMN businesses.sms_credits_monthly_limit IS 'Monthly SMS credit limit (500 for AI Auto Lead)';
