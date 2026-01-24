-- Add lead_id to jobs to link bookings/leads
ALTER TABLE jobs
  ADD COLUMN IF NOT EXISTS lead_id UUID REFERENCES leads(id) ON DELETE SET NULL;

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS jobs_lead_id_idx ON jobs(lead_id);
