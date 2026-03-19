-- Initial schema: core tables in dependency order (no RLS policies).
-- Run first (earliest timestamp). Policies are in separate migrations.

-- =============================================================================
-- 1. businesses
-- =============================================================================
CREATE TABLE IF NOT EXISTS businesses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID REFERENCES auth.users(id),
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  zip TEXT,
  website TEXT,
  description TEXT,
  logo_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  review_automation_enabled BOOLEAN DEFAULT true,
  review_delay_hours INTEGER DEFAULT 24,
  google_review_link TEXT,
  subdomain TEXT,
  business_hours JSONB,
  industry TEXT DEFAULT 'detailing',
  subscription_plan TEXT,
  subscription_status TEXT DEFAULT 'inactive',
  stripe_subscription_id TEXT,
  stripe_customer_id TEXT,
  subscription_billing_period TEXT,
  subscription_started_at TIMESTAMPTZ,
  subscription_ends_at TIMESTAMPTZ,
  team_size INTEGER DEFAULT 1,
  marketplace_business_id TEXT,
  firebase_user_id TEXT,
  sms_provider TEXT,
  surge_api_key TEXT,
  surge_account_id TEXT,
  surge_phone_number TEXT,
  condition_config JSONB DEFAULT '{"tiers":[{"id":"clean","label":"Lightly Dirty (Average)","description":"Normal daily use. Dust and light crumbs.","markup_percent":0},{"id":"moderate","label":"Moderately Dirty","description":"Stains, crumbs, mild odors.","markup_percent":0.15},{"id":"heavy","label":"Heavily Soiled","description":"Heavy stains, strong odors, deep grime.","markup_percent":0.25},{"id":"extreme","label":"Extreme / Sand / Disaster","description":"Sand removal, mold, pet accidents, or heavy debris.","markup_percent":0.40}],"enabled":false}'::jsonb,
  booking_banner_url TEXT,
  accent_color TEXT,
  sender_name TEXT,
  default_tone TEXT,
  marketplace_enabled BOOLEAN DEFAULT false,
  marketplace_status TEXT DEFAULT 'pending',
  marketplace_online_status BOOLEAN DEFAULT false,
  marketplace_current_location JSONB,
  marketplace_rating NUMERIC DEFAULT 5.0,
  marketplace_total_reviews INTEGER DEFAULT 0,
  marketplace_acceptance_rate NUMERIC DEFAULT 100.0,
  marketplace_total_jobs INTEGER DEFAULT 0,
  marketplace_total_earnings NUMERIC DEFAULT 0,
  marketplace_application_submitted_at TIMESTAMPTZ,
  marketplace_approved_at TIMESTAMPTZ,
  marketplace_rejected_reason TEXT,
  twilio_subaccount_sid TEXT,
  twilio_subaccount_auth_token TEXT,
  twilio_phone_number TEXT,
  twilio_messaging_service_sid TEXT,
  twilio_setup_complete BOOLEAN DEFAULT false,
  twilio_setup_status TEXT,
  a2p_brand_sid TEXT,
  a2p_campaign_sid TEXT,
  business_ein TEXT,
  business_ssn TEXT,
  business_legal_name TEXT,
  business_verified BOOLEAN DEFAULT false,
  sms_credits_remaining INTEGER DEFAULT 500,
  sms_credits_reset_at TIMESTAMPTZ DEFAULT now(),
  sms_credits_monthly_limit INTEGER DEFAULT 500,
  twilio_auth_token TEXT,
  service_feature_categories JSONB,
  billing_plan TEXT DEFAULT 'free',
  billing_interval TEXT DEFAULT 'monthly',
  modules JSONB DEFAULT '{}'::jsonb,
  platform_fee_item_id TEXT,
  stripe_account_id TEXT,
  stripe_onboarding_completed BOOLEAN DEFAULT false,
  twilio_account_sid TEXT
);

ALTER TABLE businesses ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS businesses_owner_id_idx ON businesses(owner_id);
CREATE INDEX IF NOT EXISTS businesses_subdomain_idx ON businesses(subdomain);

-- =============================================================================
-- 2. business_profiles
-- =============================================================================
CREATE TABLE IF NOT EXISTS business_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL UNIQUE REFERENCES businesses(id) ON DELETE CASCADE,
  tagline TEXT,
  bio TEXT,
  phone TEXT,
  email TEXT,
  service_area TEXT,
  logo_url TEXT,
  banner_url TEXT,
  instagram_url TEXT,
  facebook_url TEXT,
  tiktok_url TEXT,
  youtube_url TEXT,
  twitter_url TEXT,
  portfolio_photos JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_business_profiles_business_id ON business_profiles(business_id);
CREATE INDEX IF NOT EXISTS idx_business_profiles_created_at ON business_profiles(created_at);
ALTER TABLE business_profiles ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- 3. clients
-- =============================================================================
CREATE TABLE IF NOT EXISTS clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  name TEXT,
  email TEXT,
  phone TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_clients_business_id ON clients(business_id);
CREATE INDEX IF NOT EXISTS idx_clients_created_at ON clients(created_at);
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- 4. services
-- =============================================================================
CREATE TABLE IF NOT EXISTS services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC(10, 2),
  base_duration INTEGER,
  pricing_model TEXT CHECK (pricing_model IN ('flat', 'variable')),
  variations JSONB,
  icon TEXT,
  image_url TEXT,
  whats_included JSONB DEFAULT '[]'::jsonb,
  is_popular BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_services_business_id ON services(business_id);
CREATE INDEX IF NOT EXISTS idx_services_created_at ON services(created_at);
ALTER TABLE services ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- 5. leads
-- =============================================================================
CREATE TABLE IF NOT EXISTS leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  name TEXT,
  email TEXT,
  phone TEXT,
  source TEXT,
  interested_in_service_id UUID REFERENCES services(id) ON DELETE SET NULL,
  interested_in_service_name TEXT,
  estimated_value NUMERIC(10, 2),
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'new',
  score TEXT CHECK (score IN ('hot', 'warm', 'cold')),
  follow_up_count INTEGER DEFAULT 0,
  last_contacted_at TIMESTAMPTZ,
  viewed_at TIMESTAMPTZ,
  booking_progress INTEGER,
  abandoned_at_step INTEGER,
  sms_consent BOOLEAN,
  job_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_leads_business_id ON leads(business_id);
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON leads(created_at);
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- 6. lead_interactions
-- =============================================================================
CREATE TABLE IF NOT EXISTS lead_interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('call', 'sms', 'email', 'note')),
  direction TEXT NOT NULL CHECK (direction IN ('inbound', 'outbound')),
  content TEXT,
  outcome TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_lead_interactions_lead_id ON lead_interactions(lead_id);
CREATE INDEX IF NOT EXISTS idx_lead_interactions_business_id ON lead_interactions(business_id);
CREATE INDEX IF NOT EXISTS idx_lead_interactions_created_at ON lead_interactions(created_at);
ALTER TABLE lead_interactions ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- 7. jobs
-- =============================================================================
CREATE TABLE IF NOT EXISTS jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  service_id UUID REFERENCES services(id) ON DELETE SET NULL,
  scheduled_date DATE NOT NULL,
  scheduled_time TEXT NOT NULL,
  vehicle_type TEXT,
  address TEXT NOT NULL,
  customer_name TEXT,
  title TEXT,
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled')),
  package_details JSONB,
  addons JSONB DEFAULT '[]'::jsonb,
  vehicle_year INTEGER,
  vehicle_make TEXT,
  vehicle_model TEXT,
  vehicle_color TEXT,
  vehicle_size TEXT,
  vehicle_condition TEXT DEFAULT 'normal',
  vehicle_photo_url TEXT,
  estimated_duration INTEGER DEFAULT 120,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_jobs_business_id ON jobs(business_id);
CREATE INDEX IF NOT EXISTS idx_jobs_lead_id ON jobs(lead_id);
CREATE INDEX IF NOT EXISTS idx_jobs_scheduled_date ON jobs(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status);
CREATE INDEX IF NOT EXISTS idx_jobs_created_at ON jobs(created_at);
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;

-- Optional: enforce leads.job_id -> jobs(id) (run once; idempotent via DO block)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_leads_job_id'
  ) THEN
    ALTER TABLE leads
      ADD CONSTRAINT fk_leads_job_id FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE SET NULL;
  END IF;
END $$;

-- =============================================================================
-- 8. review_requests
-- =============================================================================
CREATE TABLE IF NOT EXISTS review_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  job_id UUID REFERENCES jobs(id) ON DELETE SET NULL,
  customer_name TEXT,
  customer_email TEXT,
  customer_phone TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  send_at TIMESTAMPTZ NOT NULL,
  sent_at TIMESTAMPTZ,
  review_link TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_review_requests_business_id ON review_requests(business_id);
CREATE INDEX IF NOT EXISTS idx_review_requests_created_at ON review_requests(created_at);
ALTER TABLE review_requests ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- 9. sequences (required by sequence_enrollments and sequence_steps)
-- =============================================================================
CREATE TABLE IF NOT EXISTS sequences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  trigger_type TEXT NOT NULL CHECK (trigger_type IN (
    'booking_abandoned', 'quote_sent', 'no_response', 'missed_call', 'post_service', 'custom'
  )),
  trigger_config JSONB DEFAULT '{}'::jsonb,
  enabled BOOLEAN DEFAULT false,
  stop_on_reply BOOLEAN DEFAULT true,
  stop_on_booking BOOLEAN DEFAULT true,
  respect_business_hours BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sequences_business_id ON sequences(business_id);
CREATE INDEX IF NOT EXISTS idx_sequences_created_at ON sequences(created_at);
ALTER TABLE sequences ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- 10. sequence_enrollments
-- =============================================================================
CREATE TABLE IF NOT EXISTS sequence_enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sequence_id UUID NOT NULL REFERENCES sequences(id) ON DELETE CASCADE,
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  current_step_order INTEGER DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'completed', 'stopped')),
  enrolled_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  stopped_at TIMESTAMPTZ,
  stop_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(sequence_id, lead_id)
);

CREATE INDEX IF NOT EXISTS idx_sequence_enrollments_sequence_id ON sequence_enrollments(sequence_id);
CREATE INDEX IF NOT EXISTS idx_sequence_enrollments_lead_id ON sequence_enrollments(lead_id);
CREATE INDEX IF NOT EXISTS idx_sequence_enrollments_created_at ON sequence_enrollments(created_at);
ALTER TABLE sequence_enrollments ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- 11. sequence_steps
-- =============================================================================
CREATE TABLE IF NOT EXISTS sequence_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sequence_id UUID NOT NULL REFERENCES sequences(id) ON DELETE CASCADE,
  step_order INTEGER NOT NULL,
  step_type TEXT NOT NULL CHECK (step_type IN (
    'send_sms', 'send_email', 'wait', 'condition', 'add_tag', 'change_status', 'notify_user'
  )),
  delay_value INTEGER,
  delay_unit TEXT CHECK (delay_unit IN ('minutes', 'hours', 'days')),
  channel TEXT CHECK (channel IN ('sms', 'email')),
  subject TEXT,
  message_template TEXT NOT NULL,
  condition_type TEXT CHECK (condition_type IN ('replied', 'clicked_booking', 'no_reply', 'custom')),
  condition_config JSONB DEFAULT '{}'::jsonb,
  tag_name TEXT,
  status_value TEXT,
  notification_config JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(sequence_id, step_order)
);

CREATE INDEX IF NOT EXISTS idx_sequence_steps_sequence_id ON sequence_steps(sequence_id);
CREATE INDEX IF NOT EXISTS idx_sequence_steps_created_at ON sequence_steps(created_at);
ALTER TABLE sequence_steps ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- 12. sequence_step_executions
-- =============================================================================
CREATE TABLE IF NOT EXISTS sequence_step_executions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  enrollment_id UUID NOT NULL REFERENCES sequence_enrollments(id) ON DELETE CASCADE,
  step_id UUID NOT NULL REFERENCES sequence_steps(id) ON DELETE CASCADE,
  executed_at TIMESTAMPTZ DEFAULT NOW(),
  status TEXT NOT NULL CHECK (status IN ('pending', 'sent', 'delivered', 'failed', 'skipped')),
  interaction_id UUID REFERENCES lead_interactions(id) ON DELETE SET NULL,
  error_message TEXT,
  message_sent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sequence_step_executions_enrollment_id ON sequence_step_executions(enrollment_id);
CREATE INDEX IF NOT EXISTS idx_sequence_step_executions_created_at ON sequence_step_executions(created_at);
ALTER TABLE sequence_step_executions ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- 13. stripe_customers
-- =============================================================================
CREATE TABLE IF NOT EXISTS stripe_customers (
  user_id UUID PRIMARY KEY,
  stripe_customer_id TEXT NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_stripe_customers_updated_at ON stripe_customers(updated_at);
ALTER TABLE stripe_customers ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- 14. billing_items
-- =============================================================================
CREATE TABLE IF NOT EXISTS billing_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  module TEXT NOT NULL,
  stripe_price_id TEXT NOT NULL,
  stripe_subscription_item_id TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_billing_items_business_id ON billing_items(business_id);
CREATE INDEX IF NOT EXISTS idx_billing_items_created_at ON billing_items(created_at);
CREATE UNIQUE INDEX IF NOT EXISTS idx_billing_items_business_item ON billing_items(business_id, stripe_subscription_item_id);
ALTER TABLE billing_items ENABLE ROW LEVEL SECURITY;
