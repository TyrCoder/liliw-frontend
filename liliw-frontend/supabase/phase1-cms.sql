-- Phase 1: CMS Foundation — Run this in the Supabase Dashboard SQL Editor
-- Creates 6 content tables + 1 media table for the custom CMS

-- ─────────────────────────────────────────────
-- 1. ATTRACTIONS
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS cms_attractions (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name           TEXT        NOT NULL,
  category       TEXT        NOT NULL DEFAULT 'heritage', -- heritage | tourist_spot | dining | other
  description    TEXT,
  location       TEXT,
  map_lat        NUMERIC,
  map_lng        NUMERIC,
  features       TEXT,       -- richtext markdown
  sort_order     INTEGER     NOT NULL DEFAULT 0,
  slug           TEXT        UNIQUE,
  status         TEXT        NOT NULL DEFAULT 'draft', -- draft | pending | approved | rejected
  created_by     TEXT        NOT NULL,  -- staff email
  reviewed_by    TEXT,
  reject_remarks TEXT,
  published_at   TIMESTAMPTZ,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- 2. EVENTS
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS cms_events (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  title          TEXT        NOT NULL,
  category       TEXT,
  description    TEXT,
  venue          TEXT,
  date_start     TIMESTAMPTZ,
  date_end       TIMESTAMPTZ,
  is_joinable    BOOLEAN     NOT NULL DEFAULT FALSE,
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
-- 3. NEWS
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS cms_news (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  title          TEXT        NOT NULL,
  category       TEXT,
  content        TEXT,       -- richtext markdown
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
-- 4. ART FORMS
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS cms_art_forms (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name           TEXT        NOT NULL,
  icon           TEXT,       -- emoji or icon identifier
  description    TEXT,
  features       TEXT,       -- richtext markdown
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
-- 5. ARTISANS
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS cms_artisans (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name           TEXT        NOT NULL,
  craft_type     TEXT,
  description    TEXT,
  location       TEXT,
  contact_number TEXT,
  rating         NUMERIC     DEFAULT 0,
  social_media   JSONB       DEFAULT '{}',
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
-- 6. STORIES
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS cms_stories (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  title          TEXT        NOT NULL,
  category       TEXT,
  content        TEXT,       -- richtext markdown
  author         TEXT,
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
-- 7. MEDIA (links Cloudinary URLs to any CMS entry)
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS cms_media (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  content_type TEXT        NOT NULL,  -- 'attraction' | 'event' | 'news' | 'art_form' | 'artisan' | 'story'
  content_id   UUID        NOT NULL,
  url          TEXT        NOT NULL,  -- Cloudinary delivery URL
  public_id    TEXT,                  -- Cloudinary public_id (for deletion)
  alt_text     TEXT,
  sort_order   INTEGER     NOT NULL DEFAULT 0,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cms_media_content ON cms_media(content_type, content_id);

-- ─────────────────────────────────────────────
-- TRIGGER: auto-update updated_at
-- ─────────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_updated_at_attractions ON cms_attractions;
CREATE TRIGGER set_updated_at_attractions
  BEFORE UPDATE ON cms_attractions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS set_updated_at_events ON cms_events;
CREATE TRIGGER set_updated_at_events
  BEFORE UPDATE ON cms_events
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS set_updated_at_news ON cms_news;
CREATE TRIGGER set_updated_at_news
  BEFORE UPDATE ON cms_news
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS set_updated_at_art_forms ON cms_art_forms;
CREATE TRIGGER set_updated_at_art_forms
  BEFORE UPDATE ON cms_art_forms
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS set_updated_at_artisans ON cms_artisans;
CREATE TRIGGER set_updated_at_artisans
  BEFORE UPDATE ON cms_artisans
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS set_updated_at_stories ON cms_stories;
CREATE TRIGGER set_updated_at_stories
  BEFORE UPDATE ON cms_stories
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
