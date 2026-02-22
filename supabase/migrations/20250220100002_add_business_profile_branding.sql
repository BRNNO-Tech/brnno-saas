-- Add branding/theme columns to business_profiles (Custom Branding - Pro feature)
ALTER TABLE business_profiles
ADD COLUMN IF NOT EXISTS primary_color TEXT DEFAULT '#3B82F6',
ADD COLUMN IF NOT EXISTS secondary_color TEXT DEFAULT '#1E40AF',
ADD COLUMN IF NOT EXISTS accent_color TEXT DEFAULT '#10B981',
ADD COLUMN IF NOT EXISTS font_family TEXT DEFAULT 'inter',
ADD COLUMN IF NOT EXISTS button_style TEXT DEFAULT 'rounded',
ADD COLUMN IF NOT EXISTS show_social_icons BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS show_contact_info BOOLEAN DEFAULT true;
