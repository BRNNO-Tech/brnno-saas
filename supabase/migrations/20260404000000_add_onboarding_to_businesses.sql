-- Onboarding wizard: track whether owner has finished first-time setup.
-- Grandfather: rows present when this migration runs are marked complete; new inserts
-- use DEFAULT FALSE so only new businesses see the setup flow.

ALTER TABLE businesses ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT FALSE;

UPDATE businesses SET onboarding_completed = true;
