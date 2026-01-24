-- Migration: Add job_id column to booking_photos table
-- This allows booking photos to be directly linked to jobs
-- When a booking becomes a job, photos are automatically linked via job_id

-- Add job_id column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'booking_photos' AND column_name = 'job_id'
  ) THEN
    ALTER TABLE booking_photos 
    ADD COLUMN job_id UUID REFERENCES jobs(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Create index for performance
CREATE INDEX IF NOT EXISTS booking_photos_job_id_idx ON booking_photos(job_id);

-- Backfill existing data: Link booking photos to jobs via lead_id
-- This updates photos that were uploaded before jobs were created
UPDATE booking_photos
SET job_id = (
  SELECT id FROM jobs 
  WHERE jobs.lead_id = booking_photos.lead_id 
  LIMIT 1
)
WHERE job_id IS NULL 
  AND lead_id IS NOT NULL 
  AND EXISTS (
    SELECT 1 FROM jobs 
    WHERE jobs.lead_id = booking_photos.lead_id
  );

-- Update RLS policies to allow querying by job_id
-- Business owners can view booking photos for their jobs
DROP POLICY IF EXISTS "Business owners can view booking photos by job" ON booking_photos;
CREATE POLICY "Business owners can view booking photos by job"
  ON booking_photos FOR SELECT
  USING (
    job_id IN (
      SELECT id FROM jobs 
      WHERE business_id IN (
        SELECT id FROM businesses WHERE owner_id = auth.uid()
      )
    )
  );

-- Workers can view booking photos for their assigned jobs
DROP POLICY IF EXISTS "Workers can view booking photos for their jobs" ON booking_photos;
CREATE POLICY "Workers can view booking photos for their jobs"
  ON booking_photos FOR SELECT
  TO authenticated
  USING (
    job_id IN (
      SELECT j.id FROM jobs j
      JOIN job_assignments ja ON j.id = ja.job_id
      JOIN team_members tm ON ja.team_member_id = tm.id
      WHERE tm.user_id = auth.uid()
    )
  );

-- Comments for documentation
COMMENT ON COLUMN booking_photos.job_id IS 'Links booking photos to jobs. Set automatically when booking converts to job.';
