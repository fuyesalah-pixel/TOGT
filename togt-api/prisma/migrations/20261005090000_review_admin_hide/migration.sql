-- Admin review hiding must survive the 24h auto-publish window.
-- A review with isHiddenByAdmin=true stays out of the public listing
-- until an admin explicitly re-approves it, even once it is older
-- than 24 hours.
--
-- Idempotent on purpose: tolerates pre-existing state.

ALTER TABLE "Review" ADD COLUMN IF NOT EXISTS "isHiddenByAdmin" BOOLEAN NOT NULL DEFAULT false;
