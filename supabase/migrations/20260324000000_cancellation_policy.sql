-- Store cancellation policy on business
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS cancellation_policy JSONB;

-- Store payment intent id and hold state on jobs
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS stripe_payment_intent_id TEXT;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS payment_captured BOOLEAN DEFAULT FALSE;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMPTZ;
