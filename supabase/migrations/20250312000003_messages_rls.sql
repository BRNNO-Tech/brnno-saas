-- RLS for sms_messages table: business owners can view and insert their business's SMS messages.
-- (Twilio webhook uses service role and bypasses RLS.)

ALTER TABLE sms_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Business owners can view their sms_messages"
  ON sms_messages FOR SELECT
  USING (business_id IN (SELECT id FROM businesses WHERE owner_id = auth.uid()));

CREATE POLICY "Business owners can insert sms_messages"
  ON sms_messages FOR INSERT
  WITH CHECK (business_id IN (SELECT id FROM businesses WHERE owner_id = auth.uid()));
