-- Migration: Add completed_at column to jobs table
-- This tracks when a job was marked as completed

ALTER TABLE jobs
ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;

COMMENT ON COLUMN jobs.completed_at IS 'Timestamp when the job was marked as completed';
