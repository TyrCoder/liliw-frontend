-- Phase 1B: Extra CMS Tables — Run in Supabase Dashboard SQL Editor

-- ─────────────────────────────────────────────
-- 1. HERO SLIDES
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS cms_hero_slides (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  title          TEXT        NOT NULL,
  subtitle       TEXT,
  button_text    TEXT,
  button_link    TEXT,
  sort_order     INTEGER     NOT NULL DEFAULT 0,
  slug           TEXT        UNIQUE,
  status         TEXT        NOT NULL DEFAULT 'draft',
  created_by     TEXT        NOT NULL,
  reviewed_by    TEXT,
  reject_remarks TEXT,
  published_at   TIMESTAMPTZ,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- 2. FAQS
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS cms_faqs (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  question       TEXT        NOT NULL,
  answer         TEXT        NOT NULL,
  category       TEXT,
  sort_order     INTEGER     NOT NULL DEFAULT 0,
  status         TEXT        NOT NULL DEFAULT 'draft',
  created_by     TEXT        NOT NULL,
  reviewed_by    TEXT,
  reject_remarks TEXT,
  published_at   TIMESTAMPTZ,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- 3. ITINERARIES
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS cms_itineraries (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  title          TEXT        NOT NULL,
  description    TEXT,
  duration_days  INTEGER     NOT NULL DEFAULT 1,
  category       TEXT,
  highlights     TEXT,       -- richtext markdown
  slug           TEXT        UNIQUE,
  status         TEXT        NOT NULL DEFAULT 'draft',
  created_by     TEXT        NOT NULL,
  reviewed_by    TEXT,
  reject_remarks TEXT,
  published_at   TIMESTAMPTZ,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- INDEXES for cms_media (extra content types)
-- ─────────────────────────────────────────────
-- No changes needed — cms_media already supports any content_type string

-- ─────────────────────────────────────────────
-- TRIGGERS: auto-update updated_at
-- ─────────────────────────────────────────────
DROP TRIGGER IF EXISTS set_updated_at_hero_slides ON cms_hero_slides;
CREATE TRIGGER set_updated_at_hero_slides
  BEFORE UPDATE ON cms_hero_slides
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS set_updated_at_faqs ON cms_faqs;
CREATE TRIGGER set_updated_at_faqs
  BEFORE UPDATE ON cms_faqs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS set_updated_at_itineraries ON cms_itineraries;
CREATE TRIGGER set_updated_at_itineraries
  BEFORE UPDATE ON cms_itineraries
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
