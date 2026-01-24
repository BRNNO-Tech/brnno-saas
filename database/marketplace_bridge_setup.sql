-- Marketplace Bridge Setup
-- Syncs Supabase users to Firebase Firestore

-- Option 1: Using Supabase Database Webhooks (Recommended)
-- Go to Supabase Dashboard > Database > Webhooks
-- Create webhook:
--   - Table: auth.users
--   - Events: INSERT
--   - HTTP Request URL: https://[YOUR_PROJECT_ID].supabase.co/functions/v1/sync-to-firebase
--   - HTTP Method: POST
--   - HTTP Headers: {"Content-Type": "application/json", "Authorization": "Bearer YOUR_SERVICE_ROLE_KEY"}

-- Option 2: Using pg_net extension (Alternative)
-- Enable pg_net extension
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Create function to call Edge Function
CREATE OR REPLACE FUNCTION call_sync_to_firebase()
RETURNS TRIGGER AS $$
DECLARE
  response_id bigint;
  edge_function_url text;
  service_role_key text;
BEGIN
  -- Get Edge Function URL from environment or construct it
  edge_function_url := current_setting('app.edge_function_url', true);
  
  IF edge_function_url IS NULL THEN
    -- Construct URL from Supabase project
    -- You'll need to set this via: ALTER DATABASE postgres SET app.supabase_url = 'https://your-project.supabase.co';
    edge_function_url := current_setting('app.supabase_url', true) || '/functions/v1/sync-to-firebase';
  END IF;

  -- Get service role key (set via: ALTER DATABASE postgres SET app.service_role_key = 'your-key');
  service_role_key := current_setting('app.service_role_key', true);

  -- Call Edge Function asynchronously
  SELECT net.http_post(
    url := edge_function_url,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || COALESCE(service_role_key, '')
    ),
    body := json_build_object(
      'record', json_build_object(
        'id', NEW.id,
        'email', NEW.email,
        'phone', NEW.phone,
        'created_at', NEW.created_at,
        'raw_user_meta_data', NEW.raw_user_meta_data
      )
    )::text
  ) INTO response_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger (only if using pg_net method)
-- Uncomment below if you want to use database trigger instead of webhooks
-- DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
-- CREATE TRIGGER on_auth_user_created
--   AFTER INSERT ON auth.users
--   FOR EACH ROW
--   EXECUTE FUNCTION call_sync_to_firebase();

-- Add marketplace columns to businesses table
ALTER TABLE businesses 
ADD COLUMN IF NOT EXISTS marketplace_business_id TEXT,
ADD COLUMN IF NOT EXISTS firebase_user_id TEXT;

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_businesses_marketplace_id 
ON businesses(marketplace_business_id) 
WHERE marketplace_business_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_businesses_firebase_user_id 
ON businesses(firebase_user_id) 
WHERE firebase_user_id IS NOT NULL;
