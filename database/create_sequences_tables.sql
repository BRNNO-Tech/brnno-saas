-- Migration: Sequences System for Lead Recovery
-- Run this in your Supabase SQL Editor

-- ============================================
-- 1. Sequences Table
-- ============================================
CREATE TABLE IF NOT EXISTS sequences (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  trigger_type TEXT NOT NULL CHECK (trigger_type IN (
    'booking_abandoned',
    'quote_sent',
    'no_response',
    'missed_call',
    'post_service',
    'custom'
  )),
  trigger_config JSONB DEFAULT '{}'::jsonb, -- Custom trigger configuration
  enabled BOOLEAN DEFAULT false,
  stop_on_reply BOOLEAN DEFAULT true,
  stop_on_booking BOOLEAN DEFAULT true,
  respect_business_hours BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 2. Sequence Steps Table
-- ============================================
CREATE TABLE IF NOT EXISTS sequence_steps (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  sequence_id UUID NOT NULL REFERENCES sequences(id) ON DELETE CASCADE,
  step_order INTEGER NOT NULL, -- Order in sequence (0, 1, 2, ...)
  step_type TEXT NOT NULL CHECK (step_type IN (
    'send_sms',
    'send_email',
    'wait',
    'condition',
    'add_tag',
    'change_status',
    'notify_user'
  )),
  delay_value INTEGER, -- For wait steps: minutes/hours/days
  delay_unit TEXT CHECK (delay_unit IN ('minutes', 'hours', 'days')),
  channel TEXT CHECK (channel IN ('sms', 'email')),
  subject TEXT, -- For email steps
  message_template TEXT NOT NULL,
  condition_type TEXT CHECK (condition_type IN ('replied', 'clicked_booking', 'no_reply', 'custom')),
  condition_config JSONB DEFAULT '{}'::jsonb,
  tag_name TEXT, -- For add_tag steps
  status_value TEXT, -- For change_status steps
  notification_config JSONB DEFAULT '{}'::jsonb, -- For notify_user steps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(sequence_id, step_order)
);

-- ============================================
-- 3. Sequence Enrollments Table
-- ============================================
CREATE TABLE IF NOT EXISTS sequence_enrollments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  sequence_id UUID NOT NULL REFERENCES sequences(id) ON DELETE CASCADE,
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  current_step_order INTEGER DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'completed', 'stopped')),
  enrolled_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  stopped_at TIMESTAMPTZ,
  stop_reason TEXT, -- 'replied', 'booked', 'manual', etc.
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(sequence_id, lead_id)
);

-- ============================================
-- 4. Sequence Step Executions Table (for tracking)
-- ============================================
CREATE TABLE IF NOT EXISTS sequence_step_executions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  enrollment_id UUID NOT NULL REFERENCES sequence_enrollments(id) ON DELETE CASCADE,
  step_id UUID NOT NULL REFERENCES sequence_steps(id) ON DELETE CASCADE,
  executed_at TIMESTAMPTZ DEFAULT NOW(),
  status TEXT NOT NULL CHECK (status IN ('pending', 'sent', 'delivered', 'failed', 'skipped')),
  interaction_id UUID REFERENCES lead_interactions(id), -- Link to actual interaction if sent
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 5. Indexes
-- ============================================
CREATE INDEX IF NOT EXISTS idx_sequences_business ON sequences(business_id);
CREATE INDEX IF NOT EXISTS idx_sequences_enabled ON sequences(business_id, enabled);
CREATE INDEX IF NOT EXISTS idx_sequence_steps_sequence ON sequence_steps(sequence_id);
CREATE INDEX IF NOT EXISTS idx_sequence_steps_order ON sequence_steps(sequence_id, step_order);
CREATE INDEX IF NOT EXISTS idx_sequence_enrollments_sequence ON sequence_enrollments(sequence_id);
CREATE INDEX IF NOT EXISTS idx_sequence_enrollments_lead ON sequence_enrollments(lead_id);
CREATE INDEX IF NOT EXISTS idx_sequence_enrollments_status ON sequence_enrollments(status) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_sequence_step_executions_enrollment ON sequence_step_executions(enrollment_id);

-- ============================================
-- 6. Enable RLS
-- ============================================
ALTER TABLE sequences ENABLE ROW LEVEL SECURITY;
ALTER TABLE sequence_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE sequence_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE sequence_step_executions ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 7. RLS Policies for sequences
-- ============================================
CREATE POLICY "Users can view their own business sequences"
  ON sequences FOR SELECT
  USING (
    business_id IN (
      SELECT id FROM businesses WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert sequences for their own business"
  ON sequences FOR INSERT
  WITH CHECK (
    business_id IN (
      SELECT id FROM businesses WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own business sequences"
  ON sequences FOR UPDATE
  USING (
    business_id IN (
      SELECT id FROM businesses WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their own business sequences"
  ON sequences FOR DELETE
  USING (
    business_id IN (
      SELECT id FROM businesses WHERE owner_id = auth.uid()
    )
  );

-- ============================================
-- 8. RLS Policies for sequence_steps
-- ============================================
CREATE POLICY "Users can view steps for their business sequences"
  ON sequence_steps FOR SELECT
  USING (
    sequence_id IN (
      SELECT id FROM sequences WHERE business_id IN (
        SELECT id FROM businesses WHERE owner_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can insert steps for their business sequences"
  ON sequence_steps FOR INSERT
  WITH CHECK (
    sequence_id IN (
      SELECT id FROM sequences WHERE business_id IN (
        SELECT id FROM businesses WHERE owner_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can update steps for their business sequences"
  ON sequence_steps FOR UPDATE
  USING (
    sequence_id IN (
      SELECT id FROM sequences WHERE business_id IN (
        SELECT id FROM businesses WHERE owner_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can delete steps for their business sequences"
  ON sequence_steps FOR DELETE
  USING (
    sequence_id IN (
      SELECT id FROM sequences WHERE business_id IN (
        SELECT id FROM businesses WHERE owner_id = auth.uid()
      )
    )
  );

-- ============================================
-- 9. RLS Policies for sequence_enrollments
-- ============================================
CREATE POLICY "Users can view enrollments for their business sequences"
  ON sequence_enrollments FOR SELECT
  USING (
    sequence_id IN (
      SELECT id FROM sequences WHERE business_id IN (
        SELECT id FROM businesses WHERE owner_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can insert enrollments for their business sequences"
  ON sequence_enrollments FOR INSERT
  WITH CHECK (
    sequence_id IN (
      SELECT id FROM sequences WHERE business_id IN (
        SELECT id FROM businesses WHERE owner_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can update enrollments for their business sequences"
  ON sequence_enrollments FOR UPDATE
  USING (
    sequence_id IN (
      SELECT id FROM sequences WHERE business_id IN (
        SELECT id FROM businesses WHERE owner_id = auth.uid()
      )
    )
  );

-- ============================================
-- 10. RLS Policies for sequence_step_executions
-- ============================================
CREATE POLICY "Users can view executions for their business sequences"
  ON sequence_step_executions FOR SELECT
  USING (
    enrollment_id IN (
      SELECT id FROM sequence_enrollments WHERE sequence_id IN (
        SELECT id FROM sequences WHERE business_id IN (
          SELECT id FROM businesses WHERE owner_id = auth.uid()
        )
      )
    )
  );

-- ============================================
-- 11. Add updated_at triggers
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_sequences_updated_at
  BEFORE UPDATE ON sequences
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sequence_steps_updated_at
  BEFORE UPDATE ON sequence_steps
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sequence_enrollments_updated_at
  BEFORE UPDATE ON sequence_enrollments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
