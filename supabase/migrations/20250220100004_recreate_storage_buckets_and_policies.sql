-- Recreate all storage buckets and RLS policies (e.g. after buckets were accidentally deleted)
-- Safe to run: uses ON CONFLICT DO NOTHING for buckets, DROP POLICY IF EXISTS for policies

-- 1. booking-photos (customer uploads during booking)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'booking-photos',
  'booking-photos',
  true,
  10485760,
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- 2. job-photos (worker uploads during job completion)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'job-photos',
  'job-photos',
  true,
  10485760,
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- 3. business-logos (branding)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'business-logos',
  'business-logos',
  true,
  10485760,
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- 4. booking-banners (legacy / alternate)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'booking-banners',
  'booking-banners',
  true,
  10485760,
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- 5. business-banners (profile/booking banner)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'business-banners',
  'business-banners',
  true,
  10485760,
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- 6. service-images (services)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'service-images',
  'service-images',
  true,
  10485760,
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- 7. business-portfolios (profile portfolio photos)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'business-portfolios',
  'business-portfolios',
  true,
  10485760,
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- ========== RLS: booking-photos ==========
DROP POLICY IF EXISTS "Public can view booking photos" ON storage.objects;
CREATE POLICY "Public can view booking photos"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'booking-photos');

DROP POLICY IF EXISTS "Public can upload booking photos" ON storage.objects;
CREATE POLICY "Public can upload booking photos"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'booking-photos');

-- ========== RLS: job-photos ==========
DROP POLICY IF EXISTS "Public can view job photos" ON storage.objects;
CREATE POLICY "Public can view job photos"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'job-photos');

DROP POLICY IF EXISTS "Authenticated users can upload job photos" ON storage.objects;
CREATE POLICY "Authenticated users can upload job photos"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'job-photos' AND auth.role() = 'authenticated');

-- ========== RLS: business-logos ==========
DROP POLICY IF EXISTS "Public can view business logos" ON storage.objects;
CREATE POLICY "Public can view business logos"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'business-logos');

DROP POLICY IF EXISTS "Authenticated can upload business logos" ON storage.objects;
CREATE POLICY "Authenticated can upload business logos"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'business-logos' AND auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Authenticated can delete business logos" ON storage.objects;
CREATE POLICY "Authenticated can delete business logos"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'business-logos' AND auth.role() = 'authenticated');

-- ========== RLS: booking-banners ==========
DROP POLICY IF EXISTS "Public can view booking banners" ON storage.objects;
CREATE POLICY "Public can view booking banners"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'booking-banners');

DROP POLICY IF EXISTS "Authenticated can upload booking banners" ON storage.objects;
CREATE POLICY "Authenticated can upload booking banners"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'booking-banners' AND auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Authenticated can delete booking banners" ON storage.objects;
CREATE POLICY "Authenticated can delete booking banners"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'booking-banners' AND auth.role() = 'authenticated');

-- ========== RLS: business-banners ==========
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

-- ========== RLS: business-portfolios ==========
DROP POLICY IF EXISTS "Public can view business portfolios" ON storage.objects;
CREATE POLICY "Public can view business portfolios"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'business-portfolios');

DROP POLICY IF EXISTS "Authenticated can upload business portfolios" ON storage.objects;
CREATE POLICY "Authenticated can upload business portfolios"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'business-portfolios' AND auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Authenticated can delete business portfolios" ON storage.objects;
CREATE POLICY "Authenticated can delete business portfolios"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'business-portfolios' AND auth.role() = 'authenticated');

-- ========== RLS: service-images ==========
DROP POLICY IF EXISTS "Authenticated users can upload service images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can view service images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete their service images" ON storage.objects;
DROP POLICY IF EXISTS "Public can view service images" ON storage.objects;

CREATE POLICY "Authenticated users can upload service images"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'service-images' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Authenticated users can view service images"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'service-images');

CREATE POLICY "Authenticated users can delete their service images"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'service-images' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Public can view service images"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'service-images');
