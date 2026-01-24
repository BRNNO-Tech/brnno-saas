-- Migration: Add SMS Provider Support (Surge & Twilio)
-- Run this in your Supabase SQL Editor

-- Add SMS provider columns
ALTER TABLE businesses 
ADD COLUMN IF NOT EXISTS sms_provider TEXT CHECK (sms_provider IN ('surge', 'twilio'));

ALTER TABLE businesses 
ADD COLUMN IF NOT EXISTS surge_api_key TEXT;

ALTER TABLE businesses 
ADD COLUMN IF NOT EXISTS surge_account_id TEXT;

ALTER TABLE businesses 
ADD COLUMN IF NOT EXISTS surge_phone_number TEXT;

-- Note: twilio_account_sid may already exist in some setups
-- If not, uncomment below:
-- ALTER TABLE businesses 
-- ADD COLUMN IF NOT EXISTS twilio_account_sid TEXT;

ALTER TABLE businesses 
ADD COLUMN IF NOT EXISTS twilio_auth_token TEXT;

ALTER TABLE businesses 
ADD COLUMN IF NOT EXISTS twilio_phone_number TEXT;

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_businesses_sms_provider ON businesses(sms_provider) WHERE sms_provider IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_businesses_surge_account_id ON businesses(surge_account_id) WHERE surge_account_id IS NOT NULL;

-- Add comments for documentation
COMMENT ON COLUMN businesses.sms_provider IS 'SMS provider: surge or twilio';
COMMENT ON COLUMN businesses.surge_api_key IS 'Surge API key for SMS sending';
COMMENT ON COLUMN businesses.surge_account_id IS 'Surge account ID (e.g., acct_01kestebpne83r0nc7crmr7f4h)';
COMMENT ON COLUMN businesses.surge_phone_number IS 'Surge phone number to send SMS from (E.164 format, e.g., +15551234567)';
COMMENT ON COLUMN businesses.twilio_auth_token IS 'Twilio Auth Token for SMS sending';
COMMENT ON COLUMN businesses.twilio_phone_number IS 'Twilio phone number to send SMS from (E.164 format, e.g., +15551234567)';