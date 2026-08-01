-- Phase 14: Force RLS on saved_itineraries + participation_requests
-- RUN IN THE SUPABASE SQL EDITOR.
--
-- phase11 and phase13 both tried to lock these two tables down, and both times
-- a check afterwards with the public anon key still returned every row:
--   saved_itineraries       9 real rows → anon reads all 9
--   participation_requests  4 real rows → anon reads all 4
-- while every other table (profiles, user_points, lbo_applications,
-- audit_logs, external_reviews …) came back protected.
--
-- So the scripts almost certainly ARE running. The likely cause is a leftover
-- permissive policy — tables created through the Supabase table editor are
-- often given an "Enable read access for all users" policy (USING true) at
-- creation. Enabling RLS does nothing then, because that policy still grants
-- anon SELECT, and phase13 only dropped a policy matching its own name.
--
-- This script drops EVERY existing policy on the two tables first, then
-- rebuilds only the owner-scoped one. Step 1 also prints what was there, so
-- if the cause was something else you can see it.

-- ─────────────────────────────────────────────
-- 1. What policies exist right now?
-- ─────────────────────────────────────────────
SELECT tablename, policyname, roles, cmd, qual
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('saved_itineraries','participation_requests');

-- ─────────────────────────────────────────────
-- 2. Drop every policy on both tables
-- ─────────────────────────────────────────────
DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN
    SELECT policyname, tablename FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename IN ('saved_itineraries','participation_requests')
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', r.policyname, r.tablename);
    RAISE NOTICE 'dropped policy % on %', r.policyname, r.tablename;
  END LOOP;
END $$;

-- ─────────────────────────────────────────────
-- 3. Enable RLS and force it
-- ─────────────────────────────────────────────
-- FORCE also applies RLS to the table owner. The service role the API uses
-- bypasses RLS regardless (it connects as a BYPASSRLS role), so the app is
-- unaffected — this only removes the owner as another way around it.
ALTER TABLE public.saved_itineraries      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_itineraries      FORCE  ROW LEVEL SECURITY;
ALTER TABLE public.participation_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.participation_requests FORCE  ROW LEVEL SECURITY;

-- ─────────────────────────────────────────────
-- 4. Re-add only the policy we actually want
-- ─────────────────────────────────────────────
-- Saved trips: readable by their owner only. Writes go through API routes on
-- the service role, so no INSERT/UPDATE policy is needed.
CREATE POLICY saved_itineraries_own_read ON public.saved_itineraries
  FOR SELECT TO authenticated USING (user_id = auth.uid());

-- participation_requests holds names, emails and phone numbers and is only
-- ever read by the admin panel through a service-role route. No policy at all
-- means no direct browser access.

-- ─────────────────────────────────────────────
-- 5. Verify — expect both flags true and only the one policy
-- ─────────────────────────────────────────────
-- Read the flags from pg_class: pg_tables exposes rowsecurity but has no
-- forcerowsecurity column, and referencing it errors the whole script —
-- which, because the SQL editor runs it as one transaction, silently rolls
-- back all the work above.
SELECT c.relname       AS tablename,
       c.relrowsecurity      AS rls_enabled,
       c.relforcerowsecurity AS rls_forced
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
  AND c.relname IN ('saved_itineraries','participation_requests');

SELECT tablename, policyname, roles, cmd
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('saved_itineraries','participation_requests');
