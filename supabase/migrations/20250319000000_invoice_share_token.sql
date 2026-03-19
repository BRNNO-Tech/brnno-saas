-- Public share links for invoices (token in URL, optional expiry)
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS share_token TEXT;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS share_token_expires_at TIMESTAMPTZ;

CREATE UNIQUE INDEX IF NOT EXISTS invoices_share_token_idx ON invoices(share_token) WHERE share_token IS NOT NULL;
