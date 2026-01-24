-- Migration: Signup Leads Tracking for Recovery Funnel
-- Run this in your Supabase SQL Editor

CREATE TABLE IF NOT EXISTS signup_leads (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  name TEXT,
  current_step INTEGER DEFAULT 1,
  step_1_completed_at TIMESTAMPTZ,
  step_2_completed_at TIMESTAMPTZ,
  step_3_completed_at TIMESTAMPTZ,
  step_4_completed_at TIMESTAMPTZ,
  abandoned_at_step TEXT,
  abandoned_at TIMESTAMPTZ,
  converted BOOLEAN DEFAULT false,
  converted_at TIMESTAMPTZ,
  selected_plan TEXT,
  billing_period TEXT,
  team_size INTEGER,
  recovery_emails_sent INTEGER DEFAULT 0,
  last_recovery_email_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_signup_leads_email ON signup_leads(email);
CREATE INDEX IF NOT EXISTS idx_signup_leads_converted ON signup_leads(converted);
CREATE INDEX IF NOT EXISTS idx_signup_leads_abandoned ON signup_leads(abandoned_at) WHERE abandoned_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_signup_leads_recovery ON signup_leads(abandoned_at, recovery_emails_sent) WHERE converted = false AND abandoned_at IS NOT NULL;

-- Enable RLS
ALTER TABLE signup_leads ENABLE ROW LEVEL SECURITY;

-- Allow public inserts (for tracking before auth)
CREATE POLICY "Allow public signup lead creation"
  ON signup_leads FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Allow service role to read/update (for recovery emails via API)
-- Service role key bypasses RLS, so this is mainly for documentation
-- The API routes will use SUPABASE_SERVICE_ROLE_KEY

-- Add comments for documentation
COMMENT ON TABLE signup_leads IS 'Tracks signup progress and abandonment for recovery funnel';
COMMENT ON COLUMN signup_leads.current_step IS 'Current step in signup process (1-4)';
COMMENT ON COLUMN signup_leads.abandoned_at_step IS 'Step where user abandoned (e.g., email_collected, account_created)';
COMMENT ON COLUMN signup_leads.recovery_emails_sent IS 'Number of recovery emails sent (max 3)';

