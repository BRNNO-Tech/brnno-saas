-- Migration: Create job_assignments table
-- Run this in your Supabase SQL Editor

CREATE TABLE IF NOT EXISTS job_assignments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  team_member_id UUID NOT NULL REFERENCES team_members(id) ON DELETE CASCADE,
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  status TEXT DEFAULT 'assigned',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_job_assignments_job_id ON job_assignments(job_id);
CREATE INDEX IF NOT EXISTS idx_job_assignments_team_member_id ON job_assignments(team_member_id);

-- Enable RLS
ALTER TABLE job_assignments ENABLE ROW LEVEL SECURITY;

-- Policies (Assuming business owner can manage assignments)
-- We need to check if the job belongs to the business owned by the user
-- This requires a join with jobs table

CREATE POLICY "Users can view assignments for their business jobs"
  ON job_assignments FOR SELECT
  USING (
    job_id IN (
      SELECT id FROM jobs WHERE business_id IN (
        SELECT id FROM businesses WHERE owner_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can insert assignments for their business jobs"
  ON job_assignments FOR INSERT
  WITH CHECK (
    job_id IN (
      SELECT id FROM jobs WHERE business_id IN (
        SELECT id FROM businesses WHERE owner_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can update assignments for their business jobs"
  ON job_assignments FOR UPDATE
  USING (
    job_id IN (
      SELECT id FROM jobs WHERE business_id IN (
        SELECT id FROM businesses WHERE owner_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can delete assignments for their business jobs"
  ON job_assignments FOR DELETE
  USING (
    job_id IN (
      SELECT id FROM jobs WHERE business_id IN (
        SELECT id FROM businesses WHERE owner_id = auth.uid()
      )
    )
  );
