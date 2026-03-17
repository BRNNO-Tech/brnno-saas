-- Internal reviews: customers submit after a booking (linked to review_request).
CREATE TABLE reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE NOT NULL,
  review_request_id UUID REFERENCES review_requests(id) ON DELETE SET NULL,
  customer_name TEXT,
  customer_email TEXT,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Business owners can view their reviews"
  ON reviews FOR SELECT
  USING (business_id IN (SELECT id FROM businesses WHERE owner_id = auth.uid()));

CREATE INDEX reviews_business_id_idx ON reviews(business_id);
CREATE INDEX reviews_created_at_idx ON reviews(created_at DESC);
