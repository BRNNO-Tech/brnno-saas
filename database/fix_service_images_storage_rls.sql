-- Fix Storage RLS policies for service-images bucket
-- Run this in your Supabase SQL Editor

-- Drop existing policies to avoid errors
DROP POLICY IF EXISTS "Authenticated users can upload service images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can view service images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete their service images" ON storage.objects;
DROP POLICY IF EXISTS "Public can view service images" ON storage.objects;

-- Allow authenticated users to upload service images
CREATE POLICY "Authenticated users can upload service images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'service-images' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow authenticated users to view service images
CREATE POLICY "Authenticated users can view service images"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'service-images');

-- Allow authenticated users to delete their own service images
CREATE POLICY "Authenticated users can delete their service images"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'service-images' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow public read access to service images (for booking pages)
CREATE POLICY "Public can view service images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'service-images');
