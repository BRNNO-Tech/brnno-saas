-- Reset script: Drop and recreate job_photos table
-- ONLY RUN THIS IF YOU NEED TO START FRESH (will delete all photos!)
-- Run this in your Supabase SQL Editor

-- Drop existing table and all dependencies
DROP TABLE IF EXISTS job_photos CASCADE;

-- Create the table fresh
CREATE TABLE job_photos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  assignment_id UUID REFERENCES job_assignments(id) ON DELETE CASCADE,
  photo_type TEXT NOT NULL CHECK (photo_type IN ('before', 'after', 'other')),
  storage_path TEXT NOT NULL,
  storage_url TEXT NOT NULL,
  uploaded_by UUID REFERENCES auth.users(id),
  uploaded_at TIMESTAMPTZ DEFAULT NOW(),
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_job_photos_job_id ON job_photos(job_id);
CREATE INDEX idx_job_photos_assignment_id ON job_photos(assignment_id);
CREATE INDEX idx_job_photos_photo_type ON job_photos(photo_type);

-- Enable RLS
ALTER TABLE job_photos ENABLE ROW LEVEL SECURITY;

-- Policy: Workers can view photos for their assigned jobs
CREATE POLICY "Workers can view their job photos"
  ON job_photos FOR SELECT
  TO authenticated
  USING (
    (assignment_id IS NOT NULL AND assignment_id IN (
      SELECT id FROM job_assignments 
      WHERE team_member_id IN (
        SELECT id FROM team_members WHERE user_id = auth.uid()
      )
    ))
    OR
    job_id IN (
      SELECT j.id FROM jobs j
      JOIN job_assignments ja ON j.id = ja.job_id
      JOIN team_members tm ON ja.team_member_id = tm.id
      WHERE tm.user_id = auth.uid()
    )
  );

-- Policy: Business owners can view all photos for their jobs
CREATE POLICY "Business owners can view job photos"
  ON job_photos FOR SELECT
  TO authenticated
  USING (
    job_id IN (
      SELECT id FROM jobs WHERE business_id IN (
        SELECT id FROM businesses WHERE owner_id = auth.uid()
      )
    )
  );

-- Policy: Workers can insert photos for their assigned jobs
CREATE POLICY "Workers can upload photos for their jobs"
  ON job_photos FOR INSERT
  TO authenticated
  WITH CHECK (
    assignment_id IS NOT NULL AND assignment_id IN (
      SELECT id FROM job_assignments 
      WHERE team_member_id IN (
        SELECT id FROM team_members WHERE user_id = auth.uid()
      )
    )
  );

-- Policy: Business owners can insert photos
CREATE POLICY "Business owners can upload job photos"
  ON job_photos FOR INSERT
  TO authenticated
  WITH CHECK (
    job_id IN (
      SELECT id FROM jobs WHERE business_id IN (
        SELECT id FROM businesses WHERE owner_id = auth.uid()
      )
    )
  );

-- Policy: Workers can delete their own photos
CREATE POLICY "Workers can delete their photos"
  ON job_photos FOR DELETE
  TO authenticated
  USING (
    uploaded_by = auth.uid()
    AND
    assignment_id IS NOT NULL AND assignment_id IN (
      SELECT id FROM job_assignments 
      WHERE team_member_id IN (
        SELECT id FROM team_members WHERE user_id = auth.uid()
      )
    )
  );

-- Policy: Business owners can delete photos
CREATE POLICY "Business owners can delete job photos"
  ON job_photos FOR DELETE
  TO authenticated
  USING (
    job_id IN (
      SELECT id FROM jobs WHERE business_id IN (
        SELECT id FROM businesses WHERE owner_id = auth.uid()
      )
    )
  );

