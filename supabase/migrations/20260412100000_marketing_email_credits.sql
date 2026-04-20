-- Monthly quota for marketing campaign emails (Resend); enforced server-side in send-campaign.
ALTER TABLE businesses
  ADD COLUMN IF NOT EXISTS marketing_email_credits_remaining INTEGER;

ALTER TABLE businesses
  ADD COLUMN IF NOT EXISTS marketing_email_credits_monthly_limit INTEGER DEFAULT 1000;

ALTER TABLE businesses
  ADD COLUMN IF NOT EXISTS marketing_email_credits_reset_at TIMESTAMPTZ;

UPDATE businesses
SET
  marketing_email_credits_monthly_limit = COALESCE(marketing_email_credits_monthly_limit, 1000),
  marketing_email_credits_remaining = COALESCE(
    marketing_email_credits_remaining,
    COALESCE(marketing_email_credits_monthly_limit, 1000),
    1000
  ),
  marketing_email_credits_reset_at = COALESCE(
    marketing_email_credits_reset_at,
    (date_trunc('month', now()) + interval '1 month')
  );

ALTER TABLE businesses
  ALTER COLUMN marketing_email_credits_remaining SET DEFAULT 1000;

ALTER TABLE businesses
  ALTER COLUMN marketing_email_credits_monthly_limit SET DEFAULT 1000;

ALTER TABLE businesses
  ALTER COLUMN marketing_email_credits_remaining SET NOT NULL;

ALTER TABLE businesses
  ALTER COLUMN marketing_email_credits_monthly_limit SET NOT NULL;

COMMENT ON COLUMN businesses.marketing_email_credits_remaining IS 'Remaining marketing campaign emails this period (Resend sends)';
COMMENT ON COLUMN businesses.marketing_email_credits_monthly_limit IS 'Monthly marketing email credit pool (campaign blasts)';
COMMENT ON COLUMN businesses.marketing_email_credits_reset_at IS 'UTC timestamp when marketing email credits reset to monthly limit';
