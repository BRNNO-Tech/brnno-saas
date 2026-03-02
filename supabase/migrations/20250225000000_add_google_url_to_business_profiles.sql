-- Add Google social link to business profiles (same pattern as instagram_url, etc.)
ALTER TABLE business_profiles ADD COLUMN IF NOT EXISTS google_url TEXT;
