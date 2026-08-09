-- Phase 23 — Community events
--
-- /participate offered a form and nothing else: someone willing to help had to
-- volunteer in the abstract, with no idea what was actually being organised.
-- The page could not say "we need stewards for the Gat Tayaw festival on the
-- 14th" because there was nowhere to write that down.
--
-- cms_events is the public what's-on listing for visitors. This is the other
-- thing — activities residents can take part in — so it is kept as its own
-- content type rather than a flag on that table, where a volunteer call-out
-- would otherwise show up on the tourism events page.

CREATE TABLE IF NOT EXISTS cms_community_events (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  title          TEXT        NOT NULL,
  category       TEXT,                    -- volunteer / cleanup / workshop / outreach / festival-prep / other
  description    TEXT,
  venue          TEXT,
  date_start     TIMESTAMPTZ,
  date_end       TIMESTAMPTZ,
  organizer      TEXT,                    -- which office or group is running it
  contact_email  TEXT,
  slots          INTEGER,                 -- NULL = no limit stated
  how_to_join    TEXT,
  is_open        BOOLEAN     NOT NULL DEFAULT TRUE,
  slug           TEXT        UNIQUE,
  status         TEXT        NOT NULL DEFAULT 'draft',
  created_by     TEXT        NOT NULL,
  reviewed_by    TEXT,
  reject_remarks TEXT,
  published_at   TIMESTAMPTZ,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS cms_community_events_open_idx
  ON cms_community_events (status, date_start);

-- Same shape as every other CMS table: the public sees approved rows only,
-- and all writing goes through the server with the service role. Without the
-- read policy the section on /participate would simply render empty.
ALTER TABLE cms_community_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS cms_community_events_public_read ON cms_community_events;
CREATE POLICY cms_community_events_public_read ON cms_community_events
  FOR SELECT TO anon, authenticated USING (status = 'approved');
