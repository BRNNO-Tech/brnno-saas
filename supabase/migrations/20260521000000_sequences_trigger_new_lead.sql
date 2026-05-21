-- Allow new_lead as a sequence trigger type (enroll when a lead is first created)
ALTER TABLE sequences DROP CONSTRAINT IF EXISTS sequences_trigger_type_check;

ALTER TABLE sequences ADD CONSTRAINT sequences_trigger_type_check
  CHECK (trigger_type IN (
    'booking_abandoned',
    'quote_sent',
    'no_response',
    'missed_call',
    'post_service',
    'new_lead',
    'custom'
  ));
