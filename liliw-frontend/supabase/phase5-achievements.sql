-- Phase 5: Achievements & Rewards — Run in Supabase Dashboard SQL Editor

-- ─────────────────────────────────────────────
-- 1. ACHIEVEMENTS (definitions — admin managed)
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS achievements (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT        NOT NULL,
  description   TEXT        NOT NULL,
  icon          TEXT        NOT NULL DEFAULT '🏆',
  badge_color   TEXT        NOT NULL DEFAULT '#F59E0B',
  trigger_type  TEXT        NOT NULL, -- 'event_count' | 'review_count' | 'total_points'
  trigger_value INTEGER     NOT NULL,
  points_reward INTEGER     NOT NULL DEFAULT 0,
  sort_order    INTEGER     NOT NULL DEFAULT 0,
  is_active     BOOLEAN     NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- 2. USER POINTS (log of all earned points)
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_points (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  points         INTEGER     NOT NULL,
  action         TEXT        NOT NULL, -- 'event_signup' | 'review' | 'achievement_bonus'
  reference_id   TEXT,                 -- slug or id of the thing that triggered this
  reference_name TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS user_points_dedup
  ON user_points (user_id, action, reference_id)
  WHERE reference_id IS NOT NULL;

-- ─────────────────────────────────────────────
-- 3. USER ACHIEVEMENTS (earned badges)
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_achievements (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  achievement_id UUID        NOT NULL REFERENCES achievements(id) ON DELETE CASCADE,
  earned_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, achievement_id)
);

-- ─────────────────────────────────────────────
-- 4. SEED DEFAULT ACHIEVEMENTS
-- ─────────────────────────────────────────────
-- icon values match BADGE_ICONS in src/components/BadgeSVG.tsx (vector icons, not emoji)
INSERT INTO achievements (name, description, icon, badge_color, trigger_type, trigger_value, points_reward, sort_order) VALUES
  ('First Step',        'Sign up for your first Liliw event',       'footprints',     '#3B82F6', 'event_count',   1,   10, 10),
  ('Event Regular',     'Sign up for 3 events',                      'calendar-check', '#8B5CF6', 'event_count',   3,   25, 20),
  ('Festival Goer',     'Sign up for 5 events',                      'party-popper',   '#EC4899', 'event_count',   5,   50, 30),
  ('First Review',      'Write your first attraction review',        'star',           '#F59E0B', 'review_count',  1,   15, 40),
  ('Community Voice',   'Write 3 reviews',                           'message-square', '#10B981', 'review_count',  3,   30, 50),
  ('Critic',            'Write 5 reviews',                           'award',          '#06B6D4', 'review_count',  5,   50, 60),
  ('Rising Explorer',   'Earn 50 total points',                      'compass',        '#F97316', 'total_points', 50,   20, 70),
  ('Tourism Champion',  'Earn 150 total points',                     'trophy',         '#F59E0B', 'total_points', 150,  50, 80),
  ('Liliw Ambassador',  'Earn 300 total points',                     'sparkles',       '#EF4444', 'total_points', 300, 100, 90),
  ('Tourist Spot Explorer', 'Visit 5 tourist spots',                 'map-pin',        '#14B8A6', 'attraction_visit_count', 5, 25, 45)
ON CONFLICT DO NOTHING;
