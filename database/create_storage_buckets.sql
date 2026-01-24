-- Create Storage Buckets for Booking Photos and Job Photos
-- This migration creates all required storage buckets for the application
-- Note: Uses ON CONFLICT DO NOTHING, so it's safe to run even if buckets already exist

-- Create booking-photos bucket (for customer uploads during booking)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'booking-photos',
  'booking-photos',
  true, -- Public so photos can be displayed on booking pages
  10485760, -- 10 MB in bytes
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Create job-photos bucket (for worker uploads during job completion)
-- NOTE: This bucket may already exist if you've set up the worker app
-- The ON CONFLICT clause ensures it won't cause errors if it already exists
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'job-photos',
  'job-photos',
  true, -- Public so photos can be displayed on job pages
  10485760, -- 10 MB in bytes
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Create business-logos bucket (if not exists)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'business-logos',
  'business-logos',
  true,
  10485760, -- 10 MB in bytes
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Create booking-banners bucket (if not exists)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'booking-banners',
  'booking-banners',
  true,
  10485760, -- 10 MB in bytes
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Storage Policies for booking-photos bucket
-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Public can view booking photos" ON storage.objects;
DROP POLICY IF EXISTS "Public can upload booking photos" ON storage.objects;

-- Allow public read access (photos need to be viewable on booking pages)
CREATE POLICY "Public can view booking photos"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'booking-photos');

-- Allow anyone to upload during booking (before authentication)
-- This is needed because customers upload photos before they're authenticated
CREATE POLICY "Public can upload booking photos"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'booking-photos');

-- Storage Policies for job-photos bucket
-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Public can view job photos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload job photos" ON storage.objects;

-- Allow public read access
CREATE POLICY "Public can view job photos"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'job-photos');

-- Allow authenticated users (workers/business owners) to upload
CREATE POLICY "Authenticated users can upload job photos"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'job-photos' AND
    auth.role() = 'authenticated'
  );
