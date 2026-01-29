-- Add config for editable "What's Included" options (exterior/interior) per business
-- Run in Supabase SQL Editor

ALTER TABLE businesses
  ADD COLUMN IF NOT EXISTS service_feature_categories JSONB DEFAULT NULL;

COMMENT ON COLUMN businesses.service_feature_categories IS 'Custom "What''s Included" categories and options for service creation. When NULL, app uses default list. Shape: [{ category_id, category_label, options: [{ id, label, icon, emoji? }] }]';
