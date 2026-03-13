-- SMS messages table for inbound/outbound SMS (e.g. Twilio webhook).
-- Named sms_messages to avoid conflicting with any existing "messages" table.
-- Links to business and lead for conversation threading.

CREATE TABLE IF NOT EXISTS sms_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,
  direction TEXT NOT NULL CHECK (direction IN ('inbound', 'outbound')),
  from_number TEXT NOT NULL,
  to_number TEXT NOT NULL,
  body TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sms_messages_business_id ON sms_messages(business_id);
CREATE INDEX IF NOT EXISTS idx_sms_messages_lead_id ON sms_messages(lead_id) WHERE lead_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_sms_messages_created_at ON sms_messages(created_at);

COMMENT ON TABLE sms_messages IS 'SMS messages (inbound via Twilio webhook and outbound from app)';
COMMENT ON COLUMN sms_messages.direction IS 'inbound = from customer, outbound = from business';
COMMENT ON COLUMN sms_messages.from_number IS 'Sender phone number (E.164)';
COMMENT ON COLUMN sms_messages.to_number IS 'Recipient phone number (E.164)';
