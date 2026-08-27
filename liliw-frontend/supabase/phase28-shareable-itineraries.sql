-- Phase 28: Shareable saved itineraries
-- RUN IN THE SUPABASE SQL EDITOR (after phase11-saved-tables-fix.sql).
--
-- Saved trips are private to their owner (phase 11). This adds an opt-in
-- "public" flag so an owner can share a read-only link that anyone can open
-- without logging in.
--
-- No new RLS policy is needed: the public view is served by the API route
-- /api/trips/[id] on the service role, which returns a row only when
-- is_public = true and never exposes user_id. Browsers still cannot read the
-- table directly — the phase 11 owner-only SELECT policy is unchanged.

ALTER TABLE saved_itineraries
  ADD COLUMN IF NOT EXISTS is_public BOOLEAN NOT NULL DEFAULT false;

-- Shared links are looked up by id with is_public = true; keep that fast.
CREATE INDEX IF NOT EXISTS saved_itineraries_public_idx
  ON saved_itineraries (id) WHERE is_public;

-- Verify
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'saved_itineraries'
  AND column_name = 'is_public';
