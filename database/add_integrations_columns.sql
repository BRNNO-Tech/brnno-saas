-- Migration: Add API Keys and Webhooks Support
-- Run this in your Supabase SQL Editor

-- Add API key column
ALTER TABLE businesses 
ADD COLUMN IF NOT EXISTS api_key TEXT;

-- Add webhook endpoints column (JSONB array)
ALTER TABLE businesses 
ADD COLUMN IF NOT EXISTS webhook_endpoints JSONB DEFAULT '[]'::jsonb;

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_businesses_api_key ON businesses(api_key) WHERE api_key IS NOT NULL;

-- Add comments for documentation
COMMENT ON COLUMN businesses.api_key IS 'API key for programmatic access (format: brnno_sk_live_...)';
COMMENT ON COLUMN businesses.webhook_endpoints IS 'Array of webhook endpoint configurations (JSONB)';
