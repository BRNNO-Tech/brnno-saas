-- Add job_id to invoices so we can link auto-created invoices to the completed job
-- Fixes: "Could not find the 'job_id' column of 'invoices' in the schema cache"

ALTER TABLE invoices
ADD COLUMN IF NOT EXISTS job_id UUID REFERENCES jobs(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_invoices_job_id ON invoices(job_id) WHERE job_id IS NOT NULL;

COMMENT ON COLUMN invoices.job_id IS 'Job this invoice was created from (when auto-generated on job completion)';
