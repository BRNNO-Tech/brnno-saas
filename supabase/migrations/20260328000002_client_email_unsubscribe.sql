-- Marketing email opt-out per client (CRM)
ALTER TABLE clients
  ADD COLUMN IF NOT EXISTS email_unsubscribed BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS email_unsubscribed_at TIMESTAMPTZ;
