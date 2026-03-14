-- Promotional banner on public business profile (optional message, code, expiry)
ALTER TABLE business_profiles
  ADD COLUMN IF NOT EXISTS promo_enabled BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS promo_message TEXT,
  ADD COLUMN IF NOT EXISTS promo_code TEXT,
  ADD COLUMN IF NOT EXISTS promo_expires_at TIMESTAMPTZ;
