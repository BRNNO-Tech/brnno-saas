-- Fix Storage RLS policies for service-images bucket
-- Run this in your Supabase SQL Editor

-- Allow authenticated users to upload service images
CREATE POLICY IF NOT EXISTS "Authenticated users can upload service images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'service-images' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow authenticated users to view service images
CREATE POLICY IF NOT EXISTS "Authenticated users can view service images"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'service-images');

-- Allow authenticated users to delete their own service images
CREATE POLICY IF NOT EXISTS "Authenticated users can delete their service images"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'service-images' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow public read access to service images (for booking pages)
CREATE POLICY IF NOT EXISTS "Public can view service images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'service-images');
