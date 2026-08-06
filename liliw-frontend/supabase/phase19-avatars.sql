-- Phase 19: Profile avatars
-- RUN IN THE SUPABASE SQL EDITOR.
--
-- Until now a profile was a coloured square with the first letter of the
-- username in it — on the passport, in the navbar, and beside every review.
-- This adds somewhere to store a real one.
--
-- A single `avatar` text column holds both kinds of choice:
--   'liliw-01' … 'liliw-12'  → one of the twelve illustrated defaults, drawn
--                              from a sprite sheet in /public, so a default
--                              avatar costs no storage and no request.
--   'https://…/avatars/…'    → a custom image the visitor uploaded, living in
--                              the `avatars` Storage bucket.
--   NULL                     → no choice made; fall back to initials.
--
-- Keeping both in one column means the display code asks one question rather
-- than reconciling two fields that could disagree.

ALTER TABLE tourist_profiles
  ADD COLUMN IF NOT EXISTS avatar TEXT;

-- Custom uploads are screened in the browser before they are sent, but that
-- check is client-side and therefore bypassable. This records who last set an
-- avatar and when, so a moderator can find and clear one after the fact.
ALTER TABLE tourist_profiles
  ADD COLUMN IF NOT EXISTS avatar_updated_at TIMESTAMPTZ;

-- ── Storage ────────────────────────────────────────────────────────────────
-- The bucket itself is created by the app's setup script (it needs the service
-- role, which the SQL editor does not have). These policies govern it.
--
-- Read is public: avatars appear on public profiles and reviews, so they have
-- to be fetchable without a session.
--
-- Write is restricted to the owner's own folder. Every upload lands at
-- avatars/<user-id>/<file>, and the policy compares the first path segment to
-- auth.uid(), so one signed-in visitor cannot overwrite another's avatar.

DO $$
BEGIN
  -- Public read
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'avatars_public_read'
  ) THEN
    CREATE POLICY avatars_public_read ON storage.objects
      FOR SELECT USING (bucket_id = 'avatars');
  END IF;

  -- Owner may upload into their own folder
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'avatars_owner_insert'
  ) THEN
    CREATE POLICY avatars_owner_insert ON storage.objects
      FOR INSERT TO authenticated
      WITH CHECK (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);
  END IF;

  -- Owner may replace their own avatar
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'avatars_owner_update'
  ) THEN
    CREATE POLICY avatars_owner_update ON storage.objects
      FOR UPDATE TO authenticated
      USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);
  END IF;

  -- Owner may delete their own avatar
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'avatars_owner_delete'
  ) THEN
    CREATE POLICY avatars_owner_delete ON storage.objects
      FOR DELETE TO authenticated
      USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);
  END IF;
END $$;

-- Verify
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'tourist_profiles' AND column_name IN ('avatar', 'avatar_updated_at');

SELECT policyname FROM pg_policies
WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname LIKE 'avatars_%';
