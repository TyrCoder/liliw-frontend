-- Phase 37: Force RLS on saved_favorites
-- RUN IN THE SUPABASE SQL EDITOR.
--
-- Found during a security review: the public anon key can read every row of
-- saved_favorites — every user's favorited attractions, tied to their real
-- user_id — even though phase11 and phase13 both already tried to lock this
-- table down with ENABLE ROW LEVEL SECURITY and an owner-scoped SELECT
-- policy. This is the exact same failure mode phase14 found and fixed on
-- saved_itineraries and participation_requests: a leftover permissive policy
-- (very likely "Enable read access for all users", USING true, added by the
-- Supabase table editor when the table was first created) still grants anon
-- SELECT, and enabling RLS does nothing when another policy already grants
-- the access RLS was supposed to remove. phase13's own DROP POLICY only
-- matched its own policy's name, so the leftover one survived untouched.
--
-- phase14 fixed the other two tables this exact way but never included this
-- one — same bug, same fix, just applied here now.

-- ─────────────────────────────────────────────
-- 1. What policies exist right now?
-- ─────────────────────────────────────────────
SELECT tablename, policyname, roles, cmd, qual
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'saved_favorites';

-- ─────────────────────────────────────────────
-- 2. Drop every policy on the table
-- ─────────────────────────────────────────────
DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN
    SELECT policyname FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'saved_favorites'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.saved_favorites', r.policyname);
    RAISE NOTICE 'dropped policy % on saved_favorites', r.policyname;
  END LOOP;
END $$;

-- ─────────────────────────────────────────────
-- 3. Enable RLS and force it
-- ─────────────────────────────────────────────
-- FORCE also applies RLS to the table owner. The service role the API uses
-- bypasses RLS regardless (it connects as a BYPASSRLS role), so the app is
-- unaffected — this only removes the owner as another way around it.
ALTER TABLE public.saved_favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_favorites FORCE  ROW LEVEL SECURITY;

-- ─────────────────────────────────────────────
-- 4. Re-add only the policy we actually want
-- ─────────────────────────────────────────────
-- Favorites are readable by their owner only. Every write goes through the
-- /api/favorites route on the service role, so no INSERT/UPDATE/DELETE
-- policy is needed here.
CREATE POLICY saved_favorites_own_read ON public.saved_favorites
  FOR SELECT TO authenticated USING (user_id = auth.uid());

-- ─────────────────────────────────────────────
-- 5. Verify — expect both flags true and only the one policy
-- ─────────────────────────────────────────────
SELECT c.relname       AS tablename,
       c.relrowsecurity      AS rls_enabled,
       c.relforcerowsecurity AS rls_forced
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
  AND c.relname = 'saved_favorites';

SELECT tablename, policyname, roles, cmd
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'saved_favorites';

-- Afterwards: re-run the same anon-key probe this was found with —
-- GET {SUPABASE_URL}/rest/v1/saved_favorites?select=* with only the anon
-- apikey/Authorization headers — and confirm it now returns [] rather than
-- every user's rows.
