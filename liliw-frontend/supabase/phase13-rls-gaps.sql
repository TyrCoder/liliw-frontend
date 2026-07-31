-- Phase 13: Close the remaining RLS gaps
-- RUN IN THE SUPABASE SQL EDITOR.
--
-- phase11's column changes applied (legacy_strapi_user_id exists, saved trips
-- work again) but its RLS half did not commit — the Supabase SQL editor runs a
-- script as one transaction, so a single error anywhere rolls the rest back.
--
-- Verified against the live database just now with the public anon key:
--   saved_itineraries       9 real rows → anon can read all 9
--   participation_requests  4 real rows → anon can read all 4
--
-- Saved trips and participation/volunteer submissions (names, emails, phone
-- numbers) are therefore world-readable by anyone who lifts the anon key out
-- of the site's JavaScript.
--
-- This file is only the RLS part, kept small and idempotent so it can be re-run
-- safely and any error is obvious rather than hidden behind a rollback.

ALTER TABLE saved_itineraries      ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_favorites        ENABLE ROW LEVEL SECURITY;
ALTER TABLE participation_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE newsletter_subscribers ENABLE ROW LEVEL SECURITY;
ALTER TABLE external_reviews       ENABLE ROW LEVEL SECURITY;

-- Saved trips and favourites: readable only by the user they belong to.
-- SELECT only — every write goes through an API route on the service role,
-- which bypasses RLS. Granting INSERT here would let a browser forge rows.
DROP POLICY IF EXISTS saved_itineraries_own_read ON saved_itineraries;
CREATE POLICY saved_itineraries_own_read ON saved_itineraries
  FOR SELECT TO authenticated USING (user_id = auth.uid());

DROP POLICY IF EXISTS saved_favorites_own_read ON saved_favorites;
CREATE POLICY saved_favorites_own_read ON saved_favorites
  FOR SELECT TO authenticated USING (user_id = auth.uid());

-- participation_requests, newsletter_subscribers and external_reviews are only
-- ever read by admin pages / the attraction page, all through service-role API
-- routes. No policy at all = no direct browser access, which is what we want.

-- ─────────────────────────────────────────────
-- Verify — all five should report rowsecurity = true
-- ─────────────────────────────────────────────
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('saved_itineraries','saved_favorites','participation_requests',
                    'newsletter_subscribers','external_reviews')
ORDER BY tablename;
