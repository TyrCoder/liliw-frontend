-- Phase 10: Row Level Security — RUN THIS IN THE SUPABASE SQL EDITOR
--
-- ⚠️  READ FIRST. This is the most important migration in the project.
--
-- Every table so far was created without RLS. Supabase's anon key is public by
-- design — it ships inside the browser bundle, so anyone can read it out of the
-- site's JavaScript. With RLS off, that key can read and write these tables
-- directly through the PostgREST API, bypassing every check in the Next.js
-- routes: dumping user emails from `profiles`, inserting rows into
-- `user_points` to award themselves points, editing `rewards`, or defacing
-- `cms_*` content.
--
-- The app's own server code uses the SERVICE ROLE key (src/lib/supabase-server.ts),
-- which bypasses RLS entirely — so enabling RLS does NOT break the API routes.
-- It only closes the direct-from-browser path.
--
-- Check first: Supabase Dashboard → Table Editor. Tables show an "RLS disabled"
-- badge if unprotected. If they already say enabled, you may only need the
-- read-only policies below.
--
-- ─────────────────────────────────────────────────────────────
-- 1. Turn RLS on everywhere
-- ─────────────────────────────────────────────────────────────
-- With RLS enabled and no policy for a role, that role gets nothing. So these
-- tables become server-only (service role) until a policy says otherwise.
ALTER TABLE profiles                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_points               ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements         ENABLE ROW LEVEL SECURITY;
ALTER TABLE achievements              ENABLE ROW LEVEL SECURITY;
ALTER TABLE rewards                   ENABLE ROW LEVEL SECURITY;
ALTER TABLE reward_redemptions        ENABLE ROW LEVEL SECURITY;
ALTER TABLE attraction_visit_checkins ENABLE ROW LEVEL SECURITY;
ALTER TABLE cms_attractions           ENABLE ROW LEVEL SECURITY;
ALTER TABLE cms_events                ENABLE ROW LEVEL SECURITY;
ALTER TABLE cms_news                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE cms_stories               ENABLE ROW LEVEL SECURITY;
ALTER TABLE cms_art_forms             ENABLE ROW LEVEL SECURITY;
ALTER TABLE cms_artisans              ENABLE ROW LEVEL SECURITY;
ALTER TABLE cms_faqs                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE cms_itineraries           ENABLE ROW LEVEL SECURITY;
ALTER TABLE cms_hero_slides           ENABLE ROW LEVEL SECURITY;
ALTER TABLE cms_media                 ENABLE ROW LEVEL SECURITY;

-- ─────────────────────────────────────────────────────────────
-- 2. Public read for approved content only
-- ─────────────────────────────────────────────────────────────
-- Published CMS content is meant to be world-readable. Draft/pending/rejected
-- rows stay invisible to the public — previously anyone could have read
-- unpublished drafts straight from the API.
DO $$
DECLARE t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'cms_attractions','cms_events','cms_news','cms_stories','cms_art_forms',
    'cms_artisans','cms_faqs','cms_itineraries','cms_hero_slides'
  ] LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I', t || '_public_read', t);
    EXECUTE format(
      'CREATE POLICY %I ON %I FOR SELECT TO anon, authenticated USING (status = ''approved'')',
      t || '_public_read', t
    );
  END LOOP;
END $$;

-- Media rows are referenced by approved content and carry no user data.
DROP POLICY IF EXISTS cms_media_public_read ON cms_media;
CREATE POLICY cms_media_public_read ON cms_media
  FOR SELECT TO anon, authenticated USING (true);

-- Badge definitions are shown on the rewards/profile pages.
DROP POLICY IF EXISTS achievements_public_read ON achievements;
CREATE POLICY achievements_public_read ON achievements
  FOR SELECT TO anon, authenticated USING (is_active);

DROP POLICY IF EXISTS rewards_public_read ON rewards;
CREATE POLICY rewards_public_read ON rewards
  FOR SELECT TO anon, authenticated USING (true);

-- ─────────────────────────────────────────────────────────────
-- 3. Users may read only their own rows
-- ─────────────────────────────────────────────────────────────
-- SELECT only: all writes (awarding points, redeeming rewards, check-ins) go
-- through the server, which uses the service role. Letting the browser INSERT
-- into user_points would hand out unlimited points.
DROP POLICY IF EXISTS profiles_own_read ON profiles;
CREATE POLICY profiles_own_read ON profiles
  FOR SELECT TO authenticated USING (id = auth.uid());

DROP POLICY IF EXISTS user_points_own_read ON user_points;
CREATE POLICY user_points_own_read ON user_points
  FOR SELECT TO authenticated USING (user_id = auth.uid());

DROP POLICY IF EXISTS user_achievements_own_read ON user_achievements;
CREATE POLICY user_achievements_own_read ON user_achievements
  FOR SELECT TO authenticated USING (user_id = auth.uid());

DROP POLICY IF EXISTS reward_redemptions_own_read ON reward_redemptions;
CREATE POLICY reward_redemptions_own_read ON reward_redemptions
  FOR SELECT TO authenticated USING (user_id = auth.uid());

DROP POLICY IF EXISTS visit_checkins_own_read ON attraction_visit_checkins;
CREATE POLICY visit_checkins_own_read ON attraction_visit_checkins
  FOR SELECT TO authenticated USING (user_id = auth.uid());

-- ─────────────────────────────────────────────────────────────
-- 4. Verify
-- ─────────────────────────────────────────────────────────────
-- Every row should show rowsecurity = true.
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- After running this, smoke-test the live site: attractions/events/FAQs should
-- still load, login should work, and the profile page should still show points
-- and badges. If something 404s or empties out, it is almost certainly a table
-- that needs a public-read policy added above rather than RLS being wrong.
