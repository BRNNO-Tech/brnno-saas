-- Usage tracking per business per period (e.g. jobs count, photos count per month)
CREATE TABLE IF NOT EXISTS usage_tracking (
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  metric TEXT NOT NULL,
  period TEXT NOT NULL,
  count INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (business_id, metric, period)
);

CREATE INDEX IF NOT EXISTS idx_usage_tracking_business_period ON usage_tracking(business_id, period);

COMMENT ON TABLE usage_tracking IS 'Monthly usage counts per business for plan limits (jobs, photos)';

-- RPC: increment usage for a business/metric/period
CREATE OR REPLACE FUNCTION increment_usage(
  p_business_id UUID,
  p_metric TEXT,
  p_period TEXT,
  p_amount INTEGER DEFAULT 1
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO usage_tracking (business_id, metric, period, count)
  VALUES (p_business_id, p_metric, p_period, GREATEST(0, p_amount))
  ON CONFLICT (business_id, metric, period)
  DO UPDATE SET count = usage_tracking.count + p_amount;
END;
$$;

-- RPC: decrement usage (floor at 0)
CREATE OR REPLACE FUNCTION decrement_usage(
  p_business_id UUID,
  p_metric TEXT,
  p_period TEXT,
  p_amount INTEGER DEFAULT 1
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE usage_tracking
  SET count = GREATEST(0, count - p_amount)
  WHERE business_id = p_business_id AND metric = p_metric AND period = p_period;
END;
$$;
