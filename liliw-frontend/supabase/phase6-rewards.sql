-- Phase 6: Rewards Redemption — Run in Supabase Dashboard SQL Editor

-- ─────────────────────────────────────────────
-- 1. REWARDS (catalog — admin managed)
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS rewards (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT        NOT NULL,
  description   TEXT        NOT NULL,
  icon          TEXT        NOT NULL DEFAULT '🎁',
  badge_color   TEXT        NOT NULL DEFAULT '#1565C0',
  points_cost   INTEGER     NOT NULL,
  stock         INTEGER,               -- NULL = unlimited
  is_active     BOOLEAN     NOT NULL DEFAULT TRUE,
  sort_order    INTEGER     NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- 2. REWARD REDEMPTIONS (the "receipt" — one-time codes)
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS reward_redemptions (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reward_id       UUID        REFERENCES rewards(id) ON DELETE SET NULL,
  reward_name     TEXT        NOT NULL,
  points_spent    INTEGER     NOT NULL,
  redemption_code TEXT        NOT NULL UNIQUE,
  status          TEXT        NOT NULL DEFAULT 'pending', -- 'pending' | 'redeemed' | 'cancelled'
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  redeemed_at     TIMESTAMPTZ,
  redeemed_by     TEXT
);
