-- Ensure business-banners bucket exists (profile page uses business-banners, not booking-banners)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'business-banners',
  'business-banners',
  true,
  10485760,
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- RLS: Allow public to view business logos (so profile/dashboard can show uploaded logo)
DROP POLICY IF EXISTS "Public can view business logos" ON storage.objects;
CREATE POLICY "Public can view business logos"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'business-logos');

-- RLS: Allow authenticated users to upload/delete business logos
DROP POLICY IF EXISTS "Authenticated can upload business logos" ON storage.objects;
CREATE POLICY "Authenticated can upload business logos"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'business-logos' AND auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Authenticated can delete business logos" ON storage.objects;
CREATE POLICY "Authenticated can delete business logos"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'business-logos' AND auth.role() = 'authenticated');

-- RLS: Allow public to view business banners
DROP POLICY IF EXISTS "Public can view business banners" ON storage.objects;
CREATE POLICY "Public can view business banners"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'business-banners');

DROP POLICY IF EXISTS "Authenticated can upload business banners" ON storage.objects;
CREATE POLICY "Authenticated can upload business banners"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'business-banners' AND auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Authenticated can delete business banners" ON storage.objects;
CREATE POLICY "Authenticated can delete business banners"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'business-banners' AND auth.role() = 'authenticated');
