-- Dedicated bucket for profile banner videos (~8s clips; 25MB limit)
-- Apply this migration AND 20250305000000_business_profiles_banner_video.sql in production.

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'banner-videos',
  'banner-videos',
  true,
  26214400,
  ARRAY['video/mp4', 'video/webm']
)
ON CONFLICT (id) DO NOTHING;

-- RLS: Public read (so profile page can show video)
DROP POLICY IF EXISTS "Public can view banner videos" ON storage.objects;
CREATE POLICY "Public can view banner videos"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'banner-videos');

-- RLS: Authenticated upload/delete (business owners)
DROP POLICY IF EXISTS "Authenticated can upload banner videos" ON storage.objects;
CREATE POLICY "Authenticated can upload banner videos"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'banner-videos' AND auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Authenticated can delete banner videos" ON storage.objects;
CREATE POLICY "Authenticated can delete banner videos"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'banner-videos' AND auth.role() = 'authenticated');
