-- Add columns to businesses table for Twilio subaccounts
ALTER TABLE businesses 
ADD COLUMN IF NOT EXISTS twilio_subaccount_sid TEXT,
ADD COLUMN IF NOT EXISTS twilio_subaccount_auth_token TEXT,
ADD COLUMN IF NOT EXISTS twilio_phone_number TEXT;