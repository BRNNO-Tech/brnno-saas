-- Create the service-images storage bucket (required for service image uploads)
-- Run this in Supabase Dashboard → SQL Editor if you get "Bucket not found" when uploading service images.

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'service-images',
  'service-images',
  true,
  10485760, -- 10 MB
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;
