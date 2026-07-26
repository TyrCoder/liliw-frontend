-- Phase 9: QR-attributed check-ins + social share rewards
-- Run in Supabase Dashboard SQL Editor.

-- ─────────────────────────────────────────────
-- 1. QR-attributed check-ins
-- ─────────────────────────────────────────────
-- The QR code on each attraction encoded a plain deep link, so a visit that
-- came from physically scanning the code on site was indistinguishable from
-- someone browsing at home. The QR now encodes ?src=qr and the check-in route
-- records how the visitor arrived, so QR scans can actually be identified.
ALTER TABLE attraction_visit_checkins
  ADD COLUMN IF NOT EXISTS via TEXT NOT NULL DEFAULT 'web';

-- Supports "how many visits came from QR scans" reporting.
CREATE INDEX IF NOT EXISTS attraction_visit_checkins_via_idx
  ON attraction_visit_checkins (via);

-- ─────────────────────────────────────────────
-- 2. Social share badge
-- ─────────────────────────────────────────────
-- POST /api/social/share awards points with action='share' and
-- reference_id=<attraction id>. The existing partial unique index
-- user_points_dedup (user_id, action, reference_id) from phase 5 is what
-- stops a user farming points by clicking Share repeatedly on the same
-- attraction — no extra table or index is needed here.
--
-- trigger_type 'share_count' is handled in src/lib/achievements.ts alongside
-- event_count / review_count / attraction_visit_count.
-- NOTE: 'Liliw Ambassador' is already taken by a total_points badge in phase 5.
INSERT INTO achievements (name, description, icon, badge_color, trigger_type, trigger_value, points_reward, sort_order)
SELECT 'Word of Mouth', 'Share 3 Liliw attractions with friends', 'share-2', '#0EA5E9', 'share_count', 3, 25, 55
WHERE NOT EXISTS (SELECT 1 FROM achievements WHERE trigger_type = 'share_count');
