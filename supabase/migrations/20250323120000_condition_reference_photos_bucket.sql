-- Detailers: reference photos per condition tier (public read; writes via API service role)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'condition-reference-photos',
  'condition-reference-photos',
  true,
  10485760,
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Public can view condition reference photos" ON storage.objects;
CREATE POLICY "Public can view condition reference photos"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'condition-reference-photos');
