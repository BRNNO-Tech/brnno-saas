-- In Supabase SQL Editor
ALTER TABLE sequence_step_executions ADD COLUMN IF NOT EXISTS message_sent TEXT;
CREATE INDEX IF NOT EXISTS idx_sequence_step_executions_message_sent 
ON sequence_step_executions(message_sent);