-- Phase 8: Server-verified attraction visit dwell time — Run in Supabase Dashboard SQL Editor
--
-- POST /api/attractions/visit previously trusted a client-side setTimeout to
-- enforce the "must stay 2.5 minutes" rule before awarding visit points —
-- any authenticated POST was honored instantly. This table lets the server
-- record when a visit started (via a check-in call fired on page load) so
-- the visit-completion route can verify real elapsed time before awarding.

CREATE TABLE IF NOT EXISTS attraction_visit_checkins (
  user_id       UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  attraction_id TEXT        NOT NULL,
  started_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, attraction_id)
);
