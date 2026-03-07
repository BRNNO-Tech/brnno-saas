-- Add show_pricing to services (default true = show price on public profile and booking)
ALTER TABLE services
  ADD COLUMN IF NOT EXISTS show_pricing boolean DEFAULT true;
