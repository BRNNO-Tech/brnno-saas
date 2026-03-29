-- Link jobs to CRM clients (used for marketing audience filters). Safe if column already exists.
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS client_id UUID REFERENCES clients(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_jobs_client_id ON jobs(client_id) WHERE client_id IS NOT NULL;
