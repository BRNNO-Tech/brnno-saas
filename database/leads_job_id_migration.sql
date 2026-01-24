-- Migration: Add job_id to leads table for booking leads
-- Run this in your Supabase SQL Editor

-- Add job_id column to leads table
ALTER TABLE leads 
ADD COLUMN IF NOT EXISTS job_id UUID REFERENCES jobs(id) ON DELETE SET NULL;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_leads_job_id ON leads(job_id);

-- Add comment for documentation
COMMENT ON COLUMN leads.job_id IS 'Reference to job created from this lead (for booking leads)';
