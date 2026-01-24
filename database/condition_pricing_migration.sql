-- Migration: Add Condition Pricing Configuration
-- Run this in your Supabase SQL Editor

-- Add condition_config JSONB column to businesses table
ALTER TABLE businesses 
ADD COLUMN IF NOT EXISTS condition_config JSONB DEFAULT '{
  "enabled": false,
  "tiers": [
    {
      "id": "clean",
      "label": "Lightly Dirty (Average)",
      "description": "Normal daily use. Dust and light crumbs.",
      "markup_percent": 0
    },
    {
      "id": "moderate",
      "label": "Moderately Dirty",
      "description": "Stains, crumbs, mild odors.",
      "markup_percent": 0.15
    },
    {
      "id": "heavy",
      "label": "Heavily Soiled",
      "description": "Heavy stains, strong odors, deep grime.",
      "markup_percent": 0.25
    },
    {
      "id": "extreme",
      "label": "Extreme / Sand / Disaster",
      "description": "Sand removal, mold, pet accidents, or heavy debris.",
      "markup_percent": 0.40
    }
  ]
}'::jsonb;

-- Add comment for documentation
COMMENT ON COLUMN businesses.condition_config IS 'Configuration for vehicle condition pricing tiers (JSONB). Includes enabled flag and array of condition tiers with labels, descriptions, and markup percentages.';
