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
  claim_type    TEXT        NOT NULL DEFAULT 'irl', -- 'irl' (redeem at Tourism Office) | 'online' (instant digital badge)
  is_active     BOOLEAN     NOT NULL DEFAULT TRUE,
  sort_order    INTEGER     NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
-- safe to re-run if the table already existed before these columns were added
ALTER TABLE rewards ADD COLUMN IF NOT EXISTS claim_type       TEXT NOT NULL DEFAULT 'irl';
ALTER TABLE rewards ADD COLUMN IF NOT EXISTS image_url        TEXT;
ALTER TABLE rewards ADD COLUMN IF NOT EXISTS image_public_id  TEXT;

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
  claim_type      TEXT        NOT NULL DEFAULT 'irl', -- snapshot of rewards.claim_type at redemption time
  status          TEXT        NOT NULL DEFAULT 'pending', -- 'pending' | 'redeemed' | 'cancelled'
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  redeemed_at     TIMESTAMPTZ,
  redeemed_by     TEXT
);
ALTER TABLE reward_redemptions ADD COLUMN IF NOT EXISTS claim_type TEXT NOT NULL DEFAULT 'irl';
ALTER TABLE reward_redemptions ADD COLUMN IF NOT EXISTS image_url  TEXT;
