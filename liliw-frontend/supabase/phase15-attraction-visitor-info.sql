-- Phase 15: Visitor info fields for attractions (hours, cost, contact)
-- RUN IN THE SUPABASE SQL EDITOR.
--
-- The public attraction page already renders Phone, Hours, Website and
-- "Best For" cards, but cms_attractions has none of those columns — so that
-- whole info grid has never displayed anything. This adds them, plus the
-- cost fields for the price meter.
--
-- All nullable, so existing rows stay valid and nothing breaks before the
-- fields are filled in.

ALTER TABLE cms_attractions
  ADD COLUMN IF NOT EXISTS opening_hours TEXT,   -- e.g. "8:00 AM – 6:00 PM daily"
  ADD COLUMN IF NOT EXISTS entrance_fee  TEXT,   -- e.g. "₱100 adults · ₱50 children"
  ADD COLUMN IF NOT EXISTS price_level   TEXT,   -- free | budget | moderate | premium
  ADD COLUMN IF NOT EXISTS phone         TEXT,
  ADD COLUMN IF NOT EXISTS website       TEXT,
  ADD COLUMN IF NOT EXISTS best_for      TEXT;   -- e.g. "Families, photographers"

-- price_level drives the ₱ meter on the attraction page. Constrained so a typo
-- can't produce a level the UI doesn't know how to draw.
ALTER TABLE cms_attractions DROP CONSTRAINT IF EXISTS cms_attractions_price_level_check;
ALTER TABLE cms_attractions
  ADD CONSTRAINT cms_attractions_price_level_check
  CHECK (price_level IS NULL OR price_level IN ('free','budget','moderate','premium'));

-- Verify
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'cms_attractions'
  AND column_name IN ('opening_hours','entrance_fee','price_level','phone','website','best_for')
ORDER BY column_name;
