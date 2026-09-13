-- Phase 35: Drop the custom event-form builder tables
-- RUN IN THE SUPABASE SQL EDITOR.
--
-- Event Forms let an admin build a custom sign-up form (arbitrary fields)
-- for a regular Event with is_joinable set, separate from and redundant with
-- two other sign-up paths that stay: the fixed-field form on the event's own
-- detail page (event_signups, still gated by the same is_joinable flag) and
-- Community Events' own built-in join flow (community_event_signups). The
-- custom-form builder was the one duplicate of the three, so it's the one
-- coming out — event_signups and community_event_signups are untouched.
--
-- event_form_responses first: it references event_forms and must go first
-- for the FK, though CASCADE would handle it either way.

DROP TABLE IF EXISTS event_form_responses;
DROP TABLE IF EXISTS event_forms;

-- Verify — both should return zero rows.
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public' AND table_name IN ('event_forms', 'event_form_responses');
