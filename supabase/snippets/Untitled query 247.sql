-- Add the twilio_account_sid column
ALTER TABLE businesses 
ADD COLUMN IF NOT EXISTS twilio_account_sid TEXT;

-- And make sure sms_provider column exists
ALTER TABLE businesses 
ADD COLUMN IF NOT EXISTS sms_provider TEXT CHECK (sms_provider IN ('surge', 'twilio'));