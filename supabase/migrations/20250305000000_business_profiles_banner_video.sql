-- Add banner video URL to business_profiles (nullable; used for public profile hero when set)
ALTER TABLE business_profiles
  ADD COLUMN IF NOT EXISTS banner_video_url TEXT;
