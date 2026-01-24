-- Add discount code columns to invoices table
ALTER TABLE invoices 
ADD COLUMN IF NOT EXISTS discount_code VARCHAR(50),
ADD COLUMN IF NOT EXISTS discount_amount DECIMAL(10,2);

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_invoices_discount_code ON invoices(discount_code) WHERE discount_code IS NOT NULL;
