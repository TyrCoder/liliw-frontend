-- Phase 26 — Let staff record a participant who has no email address
--
-- Sign-ups could only arrive through the website, where an email address is
-- how someone is contacted back, so the column was NOT NULL. Staff also need
-- to record the people who turn up at the office, phone, or sign a sheet at
-- the barangay hall — and plenty of them will give a mobile number and
-- nothing else.
--
-- Dropping NOT NULL is enough on its own: the uniqueness rule that stops one
-- person joining twice is a unique index on (event_id, LOWER(email)), and
-- Postgres treats NULLs as distinct in a unique index — so any number of
-- participants with no email can be recorded, while two sign-ups sharing an
-- actual address are still caught.
--
-- Storing '' instead would have been the trap: empty strings are equal to one
-- another, so the second person without an email would collide with the first
-- and be rejected for a reason nobody could work out.

ALTER TABLE community_event_signups ALTER COLUMN email DROP NOT NULL;

-- Anyone recorded before this ran was necessarily from the website and has a
-- real address, so there is nothing to backfill.
