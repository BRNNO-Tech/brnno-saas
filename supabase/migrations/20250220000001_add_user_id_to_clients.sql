-- Link clients to auth users so guest bookings can be associated when customer signs up
-- Safe to run multiple times (uses IF NOT EXISTS)

ALTER TABLE clients ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);

CREATE INDEX IF NOT EXISTS idx_clients_user_id ON clients(user_id);

-- Allow signed-in users to read/update only their linked client rows (for future client-side use)
-- Service-role and server-side code bypass RLS for create-booking and link-guest-bookings
CREATE POLICY "Users can view their linked clients"
  ON clients FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can update their linked clients"
  ON clients FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
