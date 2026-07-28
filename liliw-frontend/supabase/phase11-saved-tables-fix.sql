-- Phase 11: Fix saved trips/favorites + close remaining RLS gaps
-- RUN IN THE SUPABASE SQL EDITOR (after phase10-rls.sql).
--
-- Two separate problems, both found from production logs:
--
-- A) Saving trips and favourites is broken in production.
--    Vercel logs show, on every call:
--      [favorites GET]   22P02 invalid input syntax for type integer: "536eed19-…"
--      [itineraries GET] 22P02 invalid input syntax for type integer: "536eed19-…"
--    saved_itineraries.user_id and saved_favorites.user_id are still INTEGER,
--    holding Strapi's old numeric user ids. Auth now issues Supabase UUIDs, so
--    every read and write against these tables fails.
--
-- B) phase10 missed these tables, because it was written from the .sql files in
--    this folder rather than from the live database. saved_itineraries and
--    participation_requests are readable by the public anon key today —
--    confirmed by querying with the anon key and getting real rows back.

-- ─────────────────────────────────────────────────────────────
-- A. Move user_id from Strapi integers to Supabase UUIDs
-- ─────────────────────────────────────────────────────────────
-- Non-destructive: the old integer column is kept under a new name rather than
-- dropped. Those rows reference Strapi accounts that no longer exist, so they
-- cannot be re-linked, but nothing is deleted and you can inspect or remove
-- them later once you're satisfied nothing of value is there.

-- saved_itineraries (has 9 legacy rows)
ALTER TABLE saved_itineraries RENAME COLUMN user_id TO legacy_strapi_user_id;
ALTER TABLE saved_itineraries ALTER COLUMN legacy_strapi_user_id DROP NOT NULL;
ALTER TABLE saved_itineraries
  ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS saved_itineraries_user_idx ON saved_itineraries (user_id);

-- saved_favorites (empty, so the column can be swapped outright)
ALTER TABLE saved_favorites DROP COLUMN IF EXISTS user_id;
ALTER TABLE saved_favorites
  ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS saved_favorites_user_idx ON saved_favorites (user_id);

-- The favourites route upserts on (user_id, attraction_id), which needs a
-- matching unique constraint or the ON CONFLICT clause errors.
CREATE UNIQUE INDEX IF NOT EXISTS saved_favorites_user_attraction_uniq
  ON saved_favorites (user_id, attraction_id);

-- ─────────────────────────────────────────────────────────────
-- B. RLS on the tables phase10 missed
-- ─────────────────────────────────────────────────────────────
ALTER TABLE saved_itineraries      ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_favorites        ENABLE ROW LEVEL SECURITY;
ALTER TABLE participation_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE newsletter_subscribers ENABLE ROW LEVEL SECURITY;

-- Saved trips and favourites are private to their owner. Reads only — all
-- writes go through the API routes on the service role.
DROP POLICY IF EXISTS saved_itineraries_own_read ON saved_itineraries;
CREATE POLICY saved_itineraries_own_read ON saved_itineraries
  FOR SELECT TO authenticated USING (user_id = auth.uid());

DROP POLICY IF EXISTS saved_favorites_own_read ON saved_favorites;
CREATE POLICY saved_favorites_own_read ON saved_favorites
  FOR SELECT TO authenticated USING (user_id = auth.uid());

-- participation_requests and newsletter_subscribers hold contact details and
-- are only ever shown in the admin panel, which uses the service role. No
-- policy at all means no direct access from a browser.

-- ─────────────────────────────────────────────────────────────
-- Verify
-- ─────────────────────────────────────────────────────────────
SELECT tablename, rowsecurity FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('saved_itineraries','saved_favorites','participation_requests','newsletter_subscribers')
ORDER BY tablename;

-- user_id should now report uuid on both tables.
SELECT table_name, column_name, data_type FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name IN ('saved_itineraries','saved_favorites')
  AND column_name LIKE '%user%'
ORDER BY table_name, column_name;

-- Afterwards: log in on the live site, save a trip and favourite an attraction,
-- then reload. Both should persist, and the 22P02 errors should stop.
