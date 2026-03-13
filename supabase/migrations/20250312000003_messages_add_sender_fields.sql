-- Add sender attribution columns to messages for business / team_member / customer
ALTER TABLE messages ADD COLUMN IF NOT EXISTS sender_type TEXT
  CHECK (sender_type IN ('business', 'team_member', 'customer'))
  DEFAULT 'business';

ALTER TABLE messages ADD COLUMN IF NOT EXISTS team_member_id UUID
  REFERENCES team_members(id) ON DELETE SET NULL;

ALTER TABLE messages ADD COLUMN IF NOT EXISTS customer_id UUID
  REFERENCES clients(id) ON DELETE SET NULL;
