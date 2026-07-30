-- Phase 13: Create the event sign-up and custom event-form tables
-- RUN IN THE SUPABASE SQL EDITOR.
--
-- Three more tables the Supabase migration never recreated. Every one of them
-- currently fails with "Could not find the table … in the schema cache":
--
--   event_signups         — the "Sign up" form on an event page. The insert
--                           error is only logged, so the user still sees a
--                           success screen while nothing is saved. Achievement
--                           points are still awarded, so a tourist can hold an
--                           "Event Regular" badge with no sign-up on record.
--   event_forms           — custom per-event forms built in the admin panel.
--   event_form_responses  — submissions to those forms.
--
-- Column names and types are taken from what the routes actually read/write:
-- api/event-signup, api/admin/event-forms, api/admin/event-forms/[id]/responses
-- and api/event-forms/[slug].

-- ─────────────────────────────────────────────
-- 1. EVENT SIGN-UPS
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS event_signups (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id    TEXT        NOT NULL,           -- CMS event id (kept TEXT: ids are '<type>-<uuid>' strings)
  event_title TEXT        NOT NULL DEFAULT '',
  full_name   TEXT        NOT NULL,
  email       TEXT        NOT NULL,
  phone       TEXT        NOT NULL DEFAULT '',
  notes       TEXT        NOT NULL DEFAULT '',
  username    TEXT        NOT NULL DEFAULT '',
  status      TEXT        NOT NULL DEFAULT 'pending',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Admin list sorts by created_at desc.
CREATE INDEX IF NOT EXISTS event_signups_created_idx ON event_signups (created_at DESC);
CREATE INDEX IF NOT EXISTS event_signups_event_idx   ON event_signups (event_id);

-- ─────────────────────────────────────────────
-- 2. CUSTOM EVENT FORMS
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS event_forms (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  event_slug  TEXT        NOT NULL UNIQUE,    -- upsert uses onConflict: 'event_slug'
  event_title TEXT        NOT NULL,
  fields      JSONB       NOT NULL DEFAULT '[]'::jsonb,  -- [{ id, label, type, required }]
  is_active   BOOLEAN     NOT NULL DEFAULT TRUE,
  created_by  TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS event_forms_slug_uniq ON event_forms (event_slug);

-- ─────────────────────────────────────────────
-- 3. FORM RESPONSES
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS event_form_responses (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  form_id          UUID        NOT NULL REFERENCES event_forms(id) ON DELETE CASCADE,
  event_slug       TEXT        NOT NULL,
  respondent_name  TEXT,
  respondent_email TEXT,
  answers          JSONB       NOT NULL DEFAULT '{}'::jsonb,
  submitted_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Admin reads responses by form_id, newest first.
CREATE INDEX IF NOT EXISTS event_form_responses_form_idx ON event_form_responses (form_id, submitted_at DESC);

-- ─────────────────────────────────────────────
-- 4. RLS
-- ─────────────────────────────────────────────
-- All three hold contact details and are only reached through API routes on
-- the service role, which bypasses RLS. No anon policy = no direct browser
-- access, same pattern as phase 10/11.
ALTER TABLE event_signups        ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_forms          ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_form_responses ENABLE ROW LEVEL SECURITY;

-- Verify
SELECT table_name, column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name IN ('event_signups','event_forms','event_form_responses')
ORDER BY table_name, ordinal_position;

-- Afterwards: open an event page, sign up, and confirm the row appears in
-- Admin → Event Sign-ups.
