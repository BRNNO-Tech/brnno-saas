-- Create waitlist table for landing page email signups
CREATE TABLE IF NOT EXISTS waitlist (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT NOT NULL UNIQUE,
    source TEXT DEFAULT 'landing_page',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index on email for faster lookups
CREATE INDEX IF NOT EXISTS idx_waitlist_email ON waitlist(email);

-- Create index on created_at for sorting
CREATE INDEX IF NOT EXISTS idx_waitlist_created_at ON waitlist(created_at DESC);

-- Enable Row Level Security
ALTER TABLE waitlist ENABLE ROW LEVEL SECURITY;

-- Create policy to allow inserts from anyone
CREATE POLICY "Allow public inserts" ON waitlist
    FOR INSERT
    TO public
    WITH CHECK (true);

-- Create policy to allow reads only for authenticated users
CREATE POLICY "Allow authenticated reads" ON waitlist
    FOR SELECT
    TO authenticated
    USING (true);

-- Add comment
COMMENT ON TABLE waitlist IS 'Stores email addresses from landing page beta signups';
