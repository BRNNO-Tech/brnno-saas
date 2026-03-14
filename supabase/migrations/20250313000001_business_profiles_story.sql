-- Owner / "My Story" personal profile on public business profile
ALTER TABLE business_profiles
  ADD COLUMN IF NOT EXISTS owner_photo_url TEXT,
  ADD COLUMN IF NOT EXISTS owner_name TEXT,
  ADD COLUMN IF NOT EXISTS owner_story TEXT,
  ADD COLUMN IF NOT EXISTS years_experience INTEGER;
