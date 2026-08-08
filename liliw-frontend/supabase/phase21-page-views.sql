-- Phase 21: Real page-view history
-- RUN IN THE SUPABASE SQL EDITOR.
--
-- Page views were counted in an in-memory Map inside the API route. On Vercel
-- that resets on every cold start and is separate per instance, so the number
-- was never a real total — and `pageViews` was in fact assigned the unique
-- visitor count, making the two dashboard cards the same figure under two
-- names. `active_sessions` holds one row per session with a last_seen, which
-- answers "who is here now" and nothing about history.
--
-- One row per view, so the dashboard can answer honestly: how many views, how
-- many distinct sessions, which pages, and how that moves over time.

CREATE TABLE IF NOT EXISTS page_views (
  id          BIGSERIAL PRIMARY KEY,
  path        TEXT NOT NULL,
  session_id  TEXT,
  device      TEXT,
  -- Set when the path is an attraction page, so "most visited attractions"
  -- is a plain lookup rather than parsing URLs on every dashboard load.
  entity_type TEXT,
  entity_id   TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Every dashboard query is "recent views, newest first", usually narrowed to a
-- window. Without this the table is scanned end to end as it grows.
CREATE INDEX IF NOT EXISTS page_views_created_at_idx ON page_views (created_at DESC);
CREATE INDEX IF NOT EXISTS page_views_path_idx       ON page_views (path);
CREATE INDEX IF NOT EXISTS page_views_entity_idx     ON page_views (entity_type, entity_id)
  WHERE entity_type IS NOT NULL;
-- Counting distinct sessions per day is the "unique visitors" figure.
CREATE INDEX IF NOT EXISTS page_views_session_idx    ON page_views (session_id, created_at DESC);

ALTER TABLE page_views ENABLE ROW LEVEL SECURITY;

-- Writes come from the server with the service role, which bypasses RLS, and
-- reads only ever happen there too. No policy is granted to anon or
-- authenticated: a visitor must not be able to read the site's traffic, nor
-- write rows to inflate it.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'page_views'
  ) THEN
    RAISE NOTICE 'page_views already has policies; leaving them alone';
  END IF;
END $$;

-- Verify
SELECT column_name, data_type FROM information_schema.columns
WHERE table_name = 'page_views' ORDER BY ordinal_position;

SELECT COUNT(*) AS rows_so_far FROM page_views;
