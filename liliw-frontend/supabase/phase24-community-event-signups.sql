-- Phase 24 — Who joined which community event
--
-- Phase 23 gave the office somewhere to post activities, and the Community
-- page an "I want to join" button. That button only pre-filled the participate
-- form with "I would like to join: <title>", so the sign-up arrived as free
-- text in the general inbox: nothing tied it to the event, nothing counted how
-- many people had answered, and finding the volunteers for one clean-up meant
-- reading every message and matching titles by eye.
--
-- This is the missing half — the participants.

CREATE TABLE IF NOT EXISTS community_event_signups (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id    UUID        NOT NULL REFERENCES cms_community_events(id) ON DELETE CASCADE,
  -- Kept alongside the reference so a list still reads correctly if the event
  -- is later renamed, and so an export means something on its own.
  event_title TEXT        NOT NULL DEFAULT '',
  full_name   TEXT        NOT NULL,
  email       TEXT        NOT NULL,
  phone       TEXT        NOT NULL DEFAULT '',
  message     TEXT        NOT NULL DEFAULT '',
  -- new → the office has not looked yet; confirmed → they have a place;
  -- cancelled → they withdrew or were not needed.
  status      TEXT        NOT NULL DEFAULT 'new'
              CHECK (status IN ('new', 'confirmed', 'cancelled')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS community_event_signups_event_idx
  ON community_event_signups (event_id, created_at DESC);

-- Someone clicking Join twice, or coming back a week later having forgotten,
-- should not appear as two volunteers. Case-insensitive, because people do not
-- type their address the same way twice.
CREATE UNIQUE INDEX IF NOT EXISTS community_event_signups_once_idx
  ON community_event_signups (event_id, LOWER(email));

-- Written and read only through the server, exactly as the other public-facing
-- submission tables are. No policy grants the anon key access, so one visitor
-- can never read the contact details of everyone else who signed up.
ALTER TABLE community_event_signups ENABLE ROW LEVEL SECURITY;
